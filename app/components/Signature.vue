<script setup lang="ts">
import { VueSignaturePad } from "@selemondev/vue3-signature-pad";

const options = ref({
    penColor: "rgb(0, 0, 0)",
    backgroundColor: "rgb(255, 255, 255, 0)",
});

const emit = defineEmits<{
  (e: "sendSignature", base64: string): void;
}>();

const signature = ref();

function handleUndo() {
    return signature.value?.undo();
}

function handleClearCanvas() {
    return signature.value.clearCanvas();
}

function handleSend() {
  const result = signature.value?.saveSignature();

  if (!result || result.isEmpty) {
    alert("Signature masih kosong");
    return;
  }

  emit("sendSignature", result.data);
}

defineExpose({
  handleSend
})

</script>

<template>
    <div class="flex flex-col space-y-2 mt-4">
        <div class="relative rounded-md">
            <VueSignaturePad
                class="border border-slate-300 rounded-md"
                ref="signature"
                height="250px"
                width="100%"
                :maxWidth="1"
                :options="{
                    penColor: options.penColor,
                }"
            />

            <div class="absolute top-3 right-4 flex flex-col space-y-2">
                <button
                    type="button"
                    class="grid p-2 bg-white rounded-md shadow-md place-items-center"
                    @click="handleUndo"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="none"
                            stroke="#000"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 8H5V3m.291 13.357a8 8 0 1 0 .188-8.991"
                        />
                    </svg>
                </button>

                <button
                    type="button"
                    class="grid p-2 bg-white rounded-md shadow-md place-items-center"
                    @click="handleClearCanvas"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 14 14"
                    >
                        <path
                            fill="none"
                            stroke="#000"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M11.5 8.5h-9l-.76 3.8a1 1 0 0 0 .21.83a1 1 0 0 0 .77.37h8.56a1.002 1.002 0 0 0 .77-.37a1.001 1.001 0 0 0 .21-.83zm0-3a1 1 0 0 1 1 1v2h-11v-2a1 1 0 0 1 1-1H4a1 1 0 0 0 1-1v-2a2 2 0 1 1 4 0v2a1 1 0 0 0 1 1zm-3 8V11"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>
