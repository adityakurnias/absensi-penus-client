<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";

// 1. Inisialisasi route di top-level setup
const route = useRoute();
const isOnline = ref(navigator.onLine);

const updateOnlineStatus = () => { isOnline.value = true; };
const updateOfflineStatus = () => { isOnline.value = false; };

onMounted(() => {
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOfflineStatus);
});

onUnmounted(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOfflineStatus);
});

// 2. Gunakan Computed Property untuk menangani perubahan path secara reaktif
const pageTitle = computed(() => {
  const path = route.path;
  const titles: Record<string, string> = {
    "/": "Beranda",
    "/absen": "Presensi Hadir",
    "/tidakhadir": "Presensi Tidak Hadir",
    "/settings": "Pengaturan",
    "/riwayat": "Riwayat",
    "/changelog": "Riwayat Perubahan"
  };

  return titles[path] || "Unknown Page";
});
</script>

<template>
  <div class="flex items-center justify-between sticky top-0 z-30 px-4 py-4 bg-white shadow-lg border-b border-gray-100">
    <div class="flex items-center space-x-2">
      <SideBar />
      <h1 class="text-xl font-bold text-gray-900">{{ pageTitle }}</h1>
    </div>
    
    <span :class="[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        isOnline ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200',
      ]">
      <span :class="['w-2 h-2 mr-1.5 rounded-full', isOnline ? 'bg-green-400' : 'bg-red-400']"></span>
      {{ isOnline ? "Online" : "Offline" }}
    </span>
  </div>
</template>