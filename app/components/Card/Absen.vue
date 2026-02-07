<template>
    <div
        class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
        <div v-if="hasSubmitted" class="p-8 pb-6 text-center">
            <h2 class="text-2xl font-medium text-gray-800 mb-2">
                Terima kasih telah {{ headerText }}
            </h2>
            <p class="text-gray-600">
                Anda sudah presensi {{ isPulang ? "pulang" : "masuk" }} hari ini
            </p>
        </div>

        <div v-else>
            <div class="p-8 pb-6">
                <h2 class="text-2xl font-medium text-center text-gray-800 mb-2">
                    Ambil Foto untuk {{ headerText }}
                </h2>
                <p class="text-center text-gray-600 text-sm">
                    Pastikan wajah Anda terlihat jelas dalam foto
                </p>
            </div>

            <div class="px-8 pb-8 space-y-6">
                <CardPhotoCard
                    :photo="photo"
                    :is-capturing="isCapturing"
                    @capture-photo="handleCameraCapture"
                    @retake-photo="() => setPhoto(null)"
                    @file-change="handleFileChange"
                />
                
                <div class="flex flex-col -space-y-2">
                    <h2 class="text-lg font-semibold text-gray-800">Tanda tangan<span class="text-red-600">*</span></h2>
                    <Signature
                        ref="signatureRef"
                        @sendSignature="onReceiveSignature"
                    />
                </div>
                
                <BaseButton
                    v-if="photo && location"
                    :is-submitting="isSubmitting"
                    @submit="handleSubmit"
                    :text="buttonText"
                    iconName="lucide:check-circle"
                    loadingIconName="lucide:loader-2"
                />

                <LocationStatus v-if="location" :location="location" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type Signature from '../Signature.vue';

const {
    photo,
    location,
    isCapturing,
    isSubmitting,
    error,
    getCurrentLocation,
    submitAttendance,
    submitPulang,
    resetForm,
    setPhoto,
    checkAbsenMasukStatus,
    checkAbsenPulangStatus,
} = useAbsen();

const AttendanceData = ref({
    photo: null as File | null,
    location: null as { latitude: number; longitude: number } | null,
    timestamp: new Date(),
    ttd: "",
    keterangan_masuk: "",
    keterangan_pulang: "",
});

const emit = defineEmits(["success", "error"]);

const signatureBase64 = ref<string | null>(null);
const signatureRef = ref<InstanceType<typeof Signature> | null>(null);

const isPulang = computed(() => new Date().getHours() >= 13);

const buttonText = computed(() =>
    isPulang.value ? "Kirim Presensi Pulang" : "Kirim Presensi Masuk",
);

const headerText = computed(() =>
    isPulang.value ? "Presensi Pulang" : "Presensi Masuk",
);


function onReceiveSignature(base64: string) {
  signatureBase64.value = base64;
}


const handleCameraCapture = async () => {
    try {
        const locationData = await getCurrentLocation();
        location.value = locationData;
        isCapturing.value = true;
    } catch (err) {
        error.value = err instanceof Error ? err.message : "Terjadi kesalahan";
        isCapturing.value = false;
    }
};

const handleFileChange = (file: File) => {
    if (file) {
        photo.value = file;
        isCapturing.value = false;
    }
};

const handleSubmit = async () => {
    if (isPulang.value) {
        await handleSubmitPulang();
    } else {
        await handleSubmitMasuk();
    }
};

const hasSubmitted = ref(false);

onMounted(async () => {
    if (isPulang.value) {
        hasSubmitted.value = await checkAbsenPulangStatus();
    } else {
        hasSubmitted.value = await checkAbsenMasukStatus();
    }
});

const handleSubmitMasuk = async () => {
    if (!photo.value || !location.value) {
        error.value = "Foto dan lokasi diperlukan untuk presensi";
        emit("error", error.value);
        return;
    }

    isSubmitting.value = true;
    error.value = null;

    try {
        AttendanceData.value.photo = photo.value;
        AttendanceData.value.location = location.value;
        AttendanceData.value.ttd = signatureBase64.value ?? ""
        await submitAttendance(AttendanceData.value);
        hasSubmitted.value = true;
        emit("success");
        setTimeout(() => {
            resetForm();
        }, 3000);
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : "Terjadi kesalahan, silahkan coba lagi nanti";
        emit("error", error.value);
    } finally {
        isSubmitting.value = false;
    }
};

const handleSubmitPulang = async () => {
    if (!photo.value || !location.value) {
        error.value = "Foto dan lokasi diperlukan untuk presensi";
        emit("error", error.value);
        return;
    }

    isSubmitting.value = true;
    error.value = null;

    try {
        AttendanceData.value.photo = photo.value;
        AttendanceData.value.location = location.value;
        await submitPulang(AttendanceData.value);
        hasSubmitted.value = true;
        emit("success", "Presensi pulang berhasil");
        setTimeout(() => {
            resetForm();
        }, 3000);
    } catch (err) {
        error.value =
            err instanceof Error
                ? err.message
                : "Terjadi kesalahan, silahkan coba lagi nanti";
        emit("error", error.value);
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
.shadow-lg {
    box-shadow:
        0 10px 25px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.focus\:ring-2:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
</style>
