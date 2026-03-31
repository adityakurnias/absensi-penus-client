<template>
  <div class="relative w-full">
    <canvas
      ref="canvasRef"
      class="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl touch-none cursor-crosshair transition-colors hover:border-blue-400 focus:border-blue-500"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart.prevent="startDrawingTouch"
      @touchmove.prevent="drawTouch"
      @touchend.prevent="stopDrawing"
    ></canvas>
    
    <div v-if="isEmpty" class="absolute inset-0 flex items-center justify-center pointer-events-none px-4 text-center">
      <span class="text-gray-400 font-medium text-sm flex items-center">
        <Icon name="lucide:pen-tool" class="w-4 h-4 mr-2" />
        Tanda Tangan di sini
      </span>
    </div>

    <div class="absolute top-2 right-2 flex space-x-2">
      <button 
        type="button" 
        @click="clearSignature" 
        class="bg-white hover:bg-red-50 text-gray-600 hover:text-red-500 p-2 rounded-lg shadow-sm border border-gray-200 transition-all z-10"
        title="Hapus Tanda Tangan"
      >
        <Icon name="lucide:eraser" class="w-4 h-4" />
      </button>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const isEmpty = ref(true);
let ctx: CanvasRenderingContext2D | null = null;

// Setup canvas bounds accurately
const resizeCanvas = () => {
  if (!canvasRef.value) return;
  const canvas = canvasRef.value;
  
  // Save current signature so it's not lost on resize
  let drawnData = null;
  if (!isEmpty.value) {
     drawnData = canvas.toDataURL();
  }
  
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Dark blue ink
    ctx.lineWidth = 3;
    
    // Restore if there was something drawn
    if (drawnData) {
      const img = new Image();
      img.onload = () => {
        ctx!.drawImage(img, 0, 0);
      };
      img.src = drawnData;
    }
  }
};

onMounted(() => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Delay a bit to ensure it grabs the right dimensions if animated in
  setTimeout(resizeCanvas, 200);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas);
});

const getCoordinates = (e: MouseEvent | TouchEvent) => {
  if (!canvasRef.value) return { x: 0, y: 0 };
  const rect = canvasRef.value.getBoundingClientRect();
  
  let clientX, clientY;
  if ('touches' in e && (e as TouchEvent).touches.length > 0) {
    clientX = (e as TouchEvent).touches[0]!.clientX;
    clientY = (e as TouchEvent).touches[0]!.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
};

const startDrawingBase = (coords: {x: number, y: number}) => {
  isDrawing.value = true;
  isEmpty.value = false;
  if (ctx) {
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }
};

const drawBase = (coords: {x: number, y: number}) => {
  if (!isDrawing.value || !ctx) return;
  ctx.lineTo(coords.x, coords.y);
  ctx.stroke();
};

const startDrawing = (e: MouseEvent) => startDrawingBase(getCoordinates(e));
const draw = (e: MouseEvent) => drawBase(getCoordinates(e));

const startDrawingTouch = (e: TouchEvent) => startDrawingBase(getCoordinates(e));
const drawTouch = (e: TouchEvent) => drawBase(getCoordinates(e));

const saveSignature = () => {
  if (!canvasRef.value || isEmpty.value) return;
  emit('update:modelValue', canvasRef.value.toDataURL('image/png'));
};

const stopDrawing = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  if (ctx) ctx.closePath();
  saveSignature();
};

const clearSignature = () => {
  if (!canvasRef.value || !ctx) return;
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  isEmpty.value = true;
  emit('update:modelValue', '');
};

// Check if external value was reset
watch(() => props.modelValue, (newVal) => {
  if (!newVal && !isEmpty.value) {
    clearSignature();
  }
});
</script>
