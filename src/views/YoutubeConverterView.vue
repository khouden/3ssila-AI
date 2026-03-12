<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "../composables/useI18n";
import {
  Youtube,
  Loader2,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
} from "lucide-vue-next";
import { exportResult, type ExportFormat } from "../services/export";
import { toast } from "../stores/toast";
import { Supadata, SupadataError } from "@supadata/js";

const { t } = useI18n();

const supadata = new Supadata({
  apiKey: import.meta.env.VITE_SUPADATA_API_KEY as string,
});

const youtubeUrl = ref("");
const transcriptText = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const isExportOpen = ref(false);

// Validate YouTube URL
const isValidYoutubeUrl = computed(() => {
  if (!youtubeUrl.value.trim()) return false;
  const pattern =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/;
  return pattern.test(youtubeUrl.value.trim());
});

// Extract video ID from URL
const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
    /(?:youtube\.com\/shorts\/)([\w-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

// Get video thumbnail
const videoThumbnail = computed(() => {
  const videoId = extractVideoId(youtubeUrl.value);
  if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  return null;
});

// Fetch transcript using Supadata SDK
const fetchTranscript = async () => {
  if (!isValidYoutubeUrl.value) return;

  isLoading.value = true;
  errorMessage.value = "";
  transcriptText.value = "";

  try {
    const result = await supadata.transcript({
      url: youtubeUrl.value.trim(),
      text: true,
      mode: "auto",
    });

    // If result contains a jobId, poll for completion
    if ("jobId" in result) {
      const MAX_POLLS = 30;
      const POLL_INTERVAL = 3000;
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
        const job = await supadata.transcript.getJobStatus(result.jobId);
        if (job.status === "completed" && job.result) {
          transcriptText.value =
            typeof job.result.content === "string"
              ? job.result.content
              : job.result.content.map((c) => c.text).join(" ");
          return;
        }
        if (job.status === "failed") {
          errorMessage.value =
            t.value.youtube?.fetchError ||
            "Failed to fetch transcript. Please try again.";
          return;
        }
      }
      errorMessage.value =
        t.value.youtube?.fetchError ||
        "Transcript processing timed out. Please try again.";
      return;
    }

    // Direct transcript result
    transcriptText.value =
      typeof result.content === "string"
        ? result.content
        : result.content.map((c) => c.text).join(" ");

    if (!transcriptText.value) {
      errorMessage.value =
        t.value.youtube?.noTranscript ||
        "No transcript available for this video.";
    }
  } catch (error) {
    if (error instanceof SupadataError) {
      if (
        error.error === "transcript-unavailable" ||
        error.error === "not-found"
      ) {
        errorMessage.value =
          t.value.youtube?.noTranscript ||
          "No transcript available for this video.";
      } else if (error.error === "limit-exceeded") {
        errorMessage.value =
          t.value.youtube?.rateLimited ||
          "Too many requests. Please try again later.";
      } else {
        errorMessage.value =
          t.value.youtube?.fetchError ||
          "Failed to fetch transcript. Please try again.";
      }
    } else {
      errorMessage.value =
        t.value.youtube?.fetchError ||
        "Failed to fetch transcript. Please try again.";
    }
  } finally {
    isLoading.value = false;
  }
};

// Copy transcript to clipboard
const copyTranscript = async () => {
  try {
    await navigator.clipboard.writeText(transcriptText.value);
    toast.show(
      t.value.common?.copiedToClipboard || "Copied to clipboard!",
      "success",
    );
  } catch {
    toast.show(t.value.common?.error || "Error", "error");
  }
};

// Export transcript
const handleExport = async (format: ExportFormat) => {
  isExportOpen.value = false;
  await exportResult(format, {
    inputText: youtubeUrl.value,
    resultText: transcriptText.value,
    mode: "summarize",
  });
};

// Clear everything
const clearAll = () => {
  youtubeUrl.value = "";
  transcriptText.value = "";
  errorMessage.value = "";
};
</script>

<template>
  <main
    class="min-h-screen bg-gray-50 dark:bg-[#121212] bg-[radial-gradient(circle_at_1px_1px,rgb(209_213_219/0.5)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgb(55_65_81/0.4)_1px,transparent_0)] bg-[length:24px_24px] py-12 px-4"
  >
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-4"
        >
          <Youtube class="w-8 h-8 text-red-500" />
        </div>
        <h1
          class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
        >
          {{ t.youtube?.title || "YouTube to Text" }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {{
            t.youtube?.subtitle ||
            "Convert any YouTube video into text by extracting its transcript."
          }}
        </p>
      </div>

      <!-- Main Card -->
      <div
        class="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <!-- Input Section -->
        <div class="p-6 md:p-8">
          <label
            for="youtube-url"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t.youtube?.urlLabel || "YouTube Video URL" }}
          </label>

          <div class="flex gap-3">
            <div class="relative flex-1">
              <div
                class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
              >
                <Youtube class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="youtube-url"
                v-model="youtubeUrl"
                type="url"
                class="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-200"
                :placeholder="
                  t.youtube?.urlPlaceholder ||
                  'https://www.youtube.com/watch?v=...'
                "
                @keyup.enter="fetchTranscript"
              />
            </div>

            <button
              v-if="youtubeUrl"
              @click="clearAll"
              class="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 cursor-pointer"
              :title="t.youtube?.clear || 'Clear'"
            >
              <Trash2 class="w-5 h-5" />
            </button>
          </div>

          <!-- Video Preview -->
          <Transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-200"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="videoThumbnail && isValidYoutubeUrl"
              class="mt-4 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <img
                :src="videoThumbnail"
                alt="Video thumbnail"
                class="w-full h-auto object-cover"
              />
            </div>
          </Transition>

          <!-- Convert Button -->
          <button
            @click="fetchTranscript"
            :disabled="!isValidYoutubeUrl || isLoading"
            class="w-full mt-5 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              isLoading
                ? 'bg-red-400 dark:bg-red-500'
                : 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
            "
          >
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
            <Youtube v-else class="w-5 h-5" />
            <span>{{
              isLoading
                ? t.youtube?.converting || "Extracting transcript..."
                : t.youtube?.convertButton || "Extract Transcript"
            }}</span>
          </button>
        </div>

        <!-- Error Message -->
        <Transition
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="errorMessage"
            class="mx-6 md:mx-8 mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <div class="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle class="w-5 h-5 flex-shrink-0" />
              <span class="text-sm font-medium">{{ errorMessage }}</span>
            </div>
          </div>
        </Transition>

        <!-- Result Section -->
        <Transition
          enter-active-class="transition ease-out duration-500"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="transcriptText"
            class="border-t border-gray-200 dark:border-gray-800"
          >
            <!-- Result Header -->
            <div
              class="flex items-center justify-between px-6 md:px-8 py-4 bg-gray-50 dark:bg-[#151515]"
            >
              <div class="flex items-center gap-2">
                <CheckCircle class="w-5 h-5 text-green-500" />
                <span
                  class="text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {{ t.youtube?.resultTitle || "Transcript" }}
                </span>
                <span
                  class="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full"
                >
                  {{ transcriptText.length }}
                  {{ t.home?.characters || "characters" }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1">
                <button
                  @click="copyTranscript"
                  class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  :title="t.home?.copy || 'Copy'"
                >
                  <Copy class="w-4.5 h-4.5" />
                </button>

                <!-- Export Dropdown -->
                <div class="relative">
                  <button
                    @click="isExportOpen = !isExportOpen"
                    class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    :title="t.home?.export || 'Export'"
                  >
                    <Download class="w-4.5 h-4.5" />
                  </button>

                  <Transition
                    enter-active-class="transition ease-out duration-200"
                    enter-from-class="opacity-0 translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition ease-in duration-150"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 translate-y-1"
                  >
                    <div
                      v-if="isExportOpen"
                      class="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1f1f1f] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10"
                    >
                      <button
                        @click="handleExport('pdf')"
                        class="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <FileText class="w-4 h-4 text-red-500" /> PDF
                      </button>
                      <button
                        @click="handleExport('docx')"
                        class="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <FileText class="w-4 h-4 text-blue-500" /> DOCX
                      </button>
                      <button
                        @click="handleExport('txt')"
                        class="w-full px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <FileText class="w-4 h-4 text-gray-500" /> TXT
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <!-- Transcript Text -->
            <div class="px-6 md:px-8 py-6">
              <div
                class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar"
              >
                {{ transcriptText }}
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Info note -->
      <p class="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
        {{
          t.youtube?.note ||
          "Transcripts are extracted from YouTube's auto-generated or manual captions."
        }}
      </p>
    </div>
  </main>
</template>
