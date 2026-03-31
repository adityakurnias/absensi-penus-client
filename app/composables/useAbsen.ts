import { ref } from "vue";
import type { AbsentData, AttendanceData, LocationData } from "~/types";

let activeMasukReq: Promise<boolean> | null = null;
let activePulangReq: Promise<boolean> | null = null;

export const useAbsen = () => {
  const photo = ref<File | null>(null);
  const location = ref<LocationData | null>(null);
  const isCapturing = ref(false);
  const isSubmitting = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);
  const config = useRuntimeConfig();
  const getToken = () => localStorage.getItem("token");
  const getUserId = () => localStorage.getItem("user_id");

  const apiFetch = async <T>(url: string, options: any = {}): Promise<T> => {
    const token = getToken();
    return await $fetch<T>(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...options.headers,
      },
    });
  };

  const handleFetchError = (err: any, defaultMsg: string) => {
    let errorMsg = defaultMsg;
    if (err?.data?.message) {
      errorMsg = err.data.message;
    }
    console.error(`Fetch error:`, err);
    throw new Error(errorMsg);
  };

  const checkAbsenMasukStatus = (): Promise<boolean> => {
    if (typeof window !== "undefined" && activeMasukReq) return activeMasukReq;

    const promise = (async () => {
      try {
        const userId = getUserId();
        if (!userId) throw new Error("User ID not found.");

        await apiFetch(`${config.public.apiUrl}/v1/absen/cek-masuk/${userId}`);
        return true;
      } catch (err: any) {
        const status = err?.statusCode || err?.status || err?.response?.status;
        if (typeof window !== "undefined") activeMasukReq = null; // Clear on error so it can retry
        if (status === 401 || status === 404) return false;
        throw new Error("Gagal memeriksa status absen masuk.");
      }
    })();

    if (typeof window !== "undefined") {
      activeMasukReq = promise;
    }
    return promise;
  };

  const checkAbsenPulangStatus = (): Promise<boolean> => {
    if (typeof window !== "undefined" && activePulangReq) return activePulangReq;

    const promise = (async () => {
      try {
        const userId = getUserId();
        if (!userId) throw new Error("User ID not found.");

        await apiFetch(`${config.public.apiUrl}/v1/absen/cek-pulang/${userId}`);
        return true;
      } catch (err: any) {
        const status = err?.statusCode || err?.status || err?.response?.status;
        if (typeof window !== "undefined") activePulangReq = null; // Clear on error so it can retry
        if (status === 401 || status === 404) return false;
        throw new Error("Gagal memeriksa status absen pulang.");
      }
    })();

    if (typeof window !== "undefined") {
      activePulangReq = promise;
    }
    return promise;
  };

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      // TEMPORARY MOCK FOR TESTING - uncomment to use

      console.warn("MOCK GPS ACTIVE: Using hardcoded coordinates for testing.");
      resolve({
        latitude: -6.467017,
        longitude: 106.864356,
        accuracy: 10,
      });
      return;
      

      if (!navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung oleh browser ini"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          const errorMessages = {
            [error.PERMISSION_DENIED]: "Akses lokasi ditolak. Mohon izinkan akses lokasi.",
            [error.POSITION_UNAVAILABLE]: "Informasi lokasi tidak tersedia.",
            [error.TIMEOUT]: "Waktu permintaan lokasi habis.",
          };
          reject(new Error(errorMessages[error.code as keyof typeof errorMessages] || "Gagal mendapatkan lokasi"));
        },
        { enableHighAccuracy: true, timeout: 25000, maximumAge: 120000 }
      );
    });
  };

  const performSubmission = async (endpoint: string, file: File, fileKey: string, payload: Record<string, any>) => {
    try {
      const formData = new FormData();
      formData.append(fileKey, file);
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      return await apiFetch(`${config.public.apiUrl}${endpoint}`, {
        method: "POST",
        body: formData,
      });
    } catch (err: any) {
      handleFetchError(err, "Gagal mengirim data presensi.");
    }
  };

  const submitAttendance = async (data: AttendanceData) => {
    if (!data.photo) throw new Error("Foto presensi tidak tersedia.");
    const res = await performSubmission("/v2/absen/masuk", data.photo, "photo_masuk", {
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      keterangan_pulang: data.keterangan_pulang,
    });
    if (typeof window !== "undefined") activeMasukReq = Promise.resolve(true);
    return res;
  };

  const submitAbsent = async (data: AbsentData) => {
    if (!data.photo) throw new Error("Foto presensi tidak tersedia.");
    return await performSubmission("/v1/absen/izin", data.photo, "photo_izin", {
      keterangan: data.keterangan,
      keterangan_masuk: data.keterangan_masuk,
    });
  };

  const submitPulang = async (data: AttendanceData) => {
    if (!data.photo) throw new Error("Foto presensi tidak tersedia.");
    const res = await performSubmission("/v1/absen/pulang", data.photo, "photo_pulang", {
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
    });
    if (typeof window !== "undefined") activePulangReq = Promise.resolve(true);
    return res;
  };

  const setPhoto = (file: File | null) => {
    if (file && !file.type.startsWith("image/")) {
      error.value = "Tipe file tidak valid. Harap gunakan file gambar.";
      return;
    }
    photo.value = file;
    if (!file) isCapturing.value = false;
  };

  const resetForm = () => {
    photo.value = null;
    location.value = null;
    error.value = null;
    success.value = false;
    isCapturing.value = false;
    isSubmitting.value = false;
  };

  const clearAbsenCache = () => {
    if (typeof window !== "undefined") {
      activeMasukReq = null;
      activePulangReq = null;
    }
  };

  return {
    photo,
    location,
    isCapturing,
    isSubmitting,
    error,
    success,
    getCurrentLocation,
    submitAttendance,
    submitAbsent,
    submitPulang,
    resetForm,
    setPhoto,
    checkAbsenMasukStatus,
    checkAbsenPulangStatus,
    clearAbsenCache,
  };
};
