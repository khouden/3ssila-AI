<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "../services/api";
import { auth } from "../stores/auth";
import { toast } from "../stores/toast";

const router = useRouter();
const route = useRoute();

// --- Languages with country codes for flag icons ---
const languages = [
  { name: "French", code: "fr" },
  { name: "English", code: "gb" },
  { name: "Spanish", code: "es" },
  { name: "German", code: "de" },
  { name: "Italian", code: "it" },
  { name: "Portuguese", code: "pt" },
  { name: "Chinese", code: "cn" },
  { name: "Japanese", code: "jp" },
  { name: "Korean", code: "kr" },
  { name: "Arabic", code: "sa" },
  { name: "Hindi", code: "in" },
  { name: "Russian", code: "ru" },
  { name: "Dutch", code: "nl" },
  { name: "Polish", code: "pl" },
  { name: "Swedish", code: "se" },
  { name: "Norwegian", code: "no" },
  { name: "Danish", code: "dk" },
  { name: "Finnish", code: "fi" },
  { name: "Greek", code: "gr" },
  { name: "Turkish", code: "tr" },
  { name: "Vietnamese", code: "vn" },
  { name: "Thai", code: "th" },
  { name: "Indonesian", code: "id" },
  { name: "Malay", code: "my" },
  { name: "Czech", code: "cz" },
  { name: "Romanian", code: "ro" },
  { name: "Hungarian", code: "hu" },
  { name: "Ukrainian", code: "ua" },
  { name: "Bengali", code: "bd" },
  { name: "Urdu", code: "pk" },
  { name: "Swahili", code: "ke" },
];

// --- State ---
const inputText = ref("");
const resultText = ref("");
const mode = ref<"translate" | "summarize">("translate");
const targetLanguage = ref("French");
const isLanguageDropdownOpen = ref(false);
const isLoading = ref(false);
const isExtracting = ref(false);
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const CHARACTER_LIMIT = 250;

// Voice capabilities
const isListening = ref(false);
const isSpeaking = ref(false);
let recognition: any = null;

// Check if Speech Recognition is supported
const isSpeechRecognitionSupported =
  "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

// --- Computed ---
const selectedLanguage = computed(() => {
  return (
    languages.find((lang) => lang.name === targetLanguage.value) || languages[0]
  );
});

// --- Lifecycle ---
onMounted(() => {
  const queryMode = route.query.mode as string;
  if (queryMode === "translate" || queryMode === "summarize") {
    mode.value = queryMode;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// --- Computed ---
const characterCount = computed(() => {
  return inputText.value.length;
});

const resultCharacterCount = computed(() => {
  return resultText.value.length;
});

// --- Methods ---
const handleSubmit = async () => {
  if (!inputText.value) return;

  isLoading.value = true;
  resultText.value = ""; // Clear previous result

  try {
    let response;
    if (mode.value === "translate") {
      response = await api.translateText(inputText.value, targetLanguage.value);
    } else {
      response = await api.summarizeText(inputText.value);
    }

    const data = response?.data || {};
    const extracted =
      mode.value === "translate"
        ? data.translation ||
          data.translated_text ||
          data.result ||
          data.output ||
          data.response ||
          ""
        : data.summary ||
          data.summary_text ||
          data.result ||
          data.output ||
          data.response ||
          "";

    resultText.value = extracted || "No result returned.";
  } catch (error: any) {
    console.error(error);
    const detail =
      error?.response?.data?.detail ||
      error?.message ||
      "Error: Could not process text. Please try again.";
    toast.error(detail);
  } finally {
    isLoading.value = false;
  }
};

const copyToClipboard = () => {
  if (resultText.value) {
    navigator.clipboard.writeText(resultText.value);
    toast.success("Copied to clipboard!");
  }
};

const goToSignup = () => {
  router.push("/signup");
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const processFile = async (file: File) => {
  // Validation 1: Check file size (1MB limit)
  if (file.size > 1024 * 1024) {
    toast.error("File size exceeds 1MB limit");
    return;
  }

  // Validation 2: Check file type
  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
  ];
  if (!validTypes.includes(file.type)) {
    toast.error("Invalid file type. Please upload PDF, DOCX, PNG, or JPEG.");
    return;
  }

  isExtracting.value = true;
  try {
    const response = await api.extractTextFromFile(file);
    const parsedText = response.data?.ParsedResults?.[0]?.ParsedText || "";
    inputText.value = parsedText;
  } catch (error: any) {
    console.error(error);
    toast.error("Failed to extract text from file.");
  } finally {
    isExtracting.value = false;
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  await processFile(file);
  target.value = "";
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
};

const handleDrop = async (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    await processFile(file);
  }
};

const closeLanguageDropdown = () => {
  setTimeout(() => (isLanguageDropdownOpen.value = false), 150);
};

// Voice handler: Toggle microphone for speech recognition
const toggleMicrophone = async () => {
  if (!isSpeechRecognitionSupported) {
    toast.error("Speech recognition is not supported in your browser");
    return;
  }

  // Stop if already listening
  if (isListening.value && recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // Ignore errors when stopping
    }
    recognition = null;
    isListening.value = false;
    return;
  }

  // Check microphone permission first
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error: any) {
    console.error("Microphone permission error:", error);
    if (error.name === "NotAllowedError") {
      toast.error(
        "Microphone access denied. Please allow microphone permissions."
      );
    } else if (error.name === "NotFoundError") {
      toast.error("No microphone found. Please connect a microphone.");
    } else {
      toast.error("Could not access microphone: " + error.message);
    }
    return;
  }

  // Create a fresh recognition instance each time
  try {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening.value = true;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      inputText.value += (inputText.value ? " " : "") + transcript;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      isListening.value = false;
      recognition = null;

      // Provide user-friendly error messages
      const errorMessages: { [key: string]: string } = {
        network:
          "Speech recognition service unavailable. This may be due to browser limitations. Try using Chrome on a secure (HTTPS) connection.",
        "not-allowed":
          "Microphone access denied. Please allow microphone permissions in your browser settings.",
        "no-speech": "No speech detected. Please try again.",
        "audio-capture":
          "No microphone found or microphone is being used by another application.",
        aborted: "Speech recognition was cancelled.",
        "language-not-supported":
          "The selected language is not supported for speech recognition.",
        "service-not-allowed":
          "Speech recognition service is not allowed. Please check your browser settings.",
      };

      const message =
        errorMessages[event.error] ||
        `Speech recognition error: ${event.error}`;

      // Only show error for significant issues
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error(message);
      }
    };

    recognition.onend = () => {
      isListening.value = false;
      recognition = null;
    };

    // Start recognition
    recognition.start();
  } catch (error: any) {
    console.error("Failed to start recognition:", error);
    isListening.value = false;
    recognition = null;
    toast.error("Failed to start speech recognition. Please try again.");
  }
};

// Voice handler: Read result text aloud
const readResult = () => {
  if (!("speechSynthesis" in window)) {
    toast.error("Speech synthesis is not supported in your browser");
    return;
  }

  if (isSpeaking.value) {
    window.speechSynthesis.cancel();
    isSpeaking.value = false;
  } else {
    const utterance = new SpeechSynthesisUtterance(resultText.value);

    // Map target language to speech synthesis language codes
    const languageMap: { [key: string]: string } = {
      French: "fr-FR",
      English: "en-US",
      Spanish: "es-ES",
      German: "de-DE",
      Italian: "it-IT",
      Portuguese: "pt-PT",
      Chinese: "zh-CN",
      Japanese: "ja-JP",
      Korean: "ko-KR",
      Arabic: "ar-SA",
      Hindi: "hi-IN",
      Russian: "ru-RU",
      Dutch: "nl-NL",
      Polish: "pl-PL",
      Swedish: "sv-SE",
      Norwegian: "nb-NO",
      Danish: "da-DK",
      Finnish: "fi-FI",
      Greek: "el-GR",
      Turkish: "tr-TR",
      Vietnamese: "vi-VN",
      Thai: "th-TH",
      Indonesian: "id-ID",
      Malay: "ms-MY",
      Czech: "cs-CZ",
      Romanian: "ro-RO",
      Hungarian: "hu-HU",
      Ukrainian: "uk-UA",
      Bengali: "bn-BD",
      Urdu: "ur-PK",
      Swahili: "sw-KE",
    };

    utterance.lang = languageMap[targetLanguage.value] || "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      isSpeaking.value = true;
    };

    utterance.onend = () => {
      isSpeaking.value = false;
    };

    utterance.onerror = (event: any) => {
      console.error("Speech synthesis error:", event.error);
      isSpeaking.value = false;
      toast.error("Speech synthesis error: " + event.error);
    };

    window.speechSynthesis.speak(utterance);
  }
};
</script>

<template>
  <div
    class="min-h-screen bg-white dark:bg-slate-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff09_1px,transparent_1px),linear-gradient(to_bottom,#ffffff09_1px,transparent_1px)] bg-[size:24px_24px]"
  >
    <div class="text-center pt-12 pb-8 px-4">
      <h1
        class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight"
      >
        {{ mode === "translate" ? "Translate Content" : "Summarize Text" }}
      </h1>
      <p class="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
        Transform your content instantly with our AI-powered tool. Select your
        mode below to get started.
      </p>
    </div>

    <div class="max-w-6xl mx-auto px-4 pb-20">
      <div
        class="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]"
      >
        <div
          class="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#252525] px-4 py-3 gap-4"
        >
          <div
            class="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-full"
          >
            <button
              @click="mode = 'translate'"
              :class="
                mode === 'translate'
                  ? 'bg-white dark:bg-gray-700 shadow text-cyan-400 font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              "
              class="px-6 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer"
            >
              Translate
            </button>
            <button
              @click="mode = 'summarize'"
              :class="
                mode === 'summarize'
                  ? 'bg-white dark:bg-gray-700 shadow text-cyan-400 font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              "
              class="px-6 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer"
            >
              Summarize
            </button>
          </div>

          <div v-if="mode === 'translate'" class="flex items-center gap-2">
            <label class="text-sm text-gray-500 dark:text-gray-400 font-medium"
              >Target:</label
            >
            <div class="relative">
              <button
                @click="isLanguageDropdownOpen = !isLanguageDropdownOpen"
                @blur="closeLanguageDropdown"
                class="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                <span :class="`fi fi-${selectedLanguage?.code}`"></span>
                <span>{{ selectedLanguage?.name }}</span>
              </button>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
              >
                <svg
                  class="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                  />
                </svg>
              </div>
              <!-- Dropdown -->
              <div
                v-if="isLanguageDropdownOpen"
                class="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
              >
                <button
                  v-for="lang in languages"
                  :key="lang.code"
                  @mousedown.prevent="
                    targetLanguage = lang.name;
                    isLanguageDropdownOpen = false;
                  "
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  :class="{
                    'bg-cyan-50 dark:bg-cyan-900/30':
                      targetLanguage === lang.name,
                  }"
                >
                  <span :class="`fi fi-${lang.code}`"></span>
                  <span>{{ lang.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col md:flex-row min-h-0">
          <div
            class="flex-1 p-6 flex flex-col relative border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] transition-colors"
            :class="{
              'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-400 border-2 border-dashed':
                isDragging,
            }"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
          >
            <!-- Drag overlay -->
            <div
              v-if="isDragging"
              class="absolute inset-0 flex items-center justify-center bg-cyan-50/80 dark:bg-cyan-900/40 z-20 pointer-events-none"
            >
              <div class="text-center">
                <svg
                  class="w-12 h-12 mx-auto text-cyan-500 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                <p class="text-cyan-600 dark:text-cyan-400 font-medium">
                  Drop your file here
                </p>
              </div>
            </div>

            <!-- Hidden file input -->
            <input
              type="file"
              ref="fileInput"
              @change="handleFileUpload"
              accept=".pdf,.docx,.jpg,.png"
              class="hidden"
            />

            <!-- Microphone button -->
            <button
              v-if="isSpeechRecognitionSupported"
              @click="toggleMicrophone"
              :class="[
                'absolute top-4 right-16 p-2 rounded-full transition-colors cursor-pointer',
                isListening
                  ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400',
              ]"
              :title="isListening ? 'Stop recording' : 'Start voice input'"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                ></path>
              </svg>
            </button>

            <!-- Upload button -->
            <button
              @click="triggerFileUpload"
              :disabled="isExtracting"
              class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Upload file (PDF, DOCX, PNG, JPEG)"
            >
              <!-- Spinning loader when extracting -->
              <svg
                v-if="isExtracting"
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <!-- Paperclip icon -->
              <svg
                v-else
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                ></path>
              </svg>
            </button>

            <textarea
              v-model="inputText"
              placeholder="Insert your text here..."
              class="w-full flex-1 resize-none outline-none text-gray-700 dark:text-gray-300 text-lg bg-transparent placeholder-gray-400 leading-relaxed"
            ></textarea>

            <div class="mt-4 flex items-center justify-between relative z-10">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-gray-400"
                  >{{ characterCount }} characters</span
                >
                <span
                  v-if="!auth.isAuthenticated()"
                  @click="goToSignup"
                  title="Sign up to have unlimited tries"
                  class="text-xs font-medium text-orange-500 hover:text-orange-600 cursor-pointer underline decoration-dotted"
                >
                  / {{ CHARACTER_LIMIT }} limit
                </span>
              </div>
              <button
                @click="handleSubmit"
                :disabled="isLoading || !inputText"
                class="bg-cyan-400 hover:bg-cyan-300 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-bold py-2.5 px-8 rounded-full shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <svg
                  v-if="isLoading"
                  class="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span v-else>
                  {{
                    mode === "translate" ? "Translate Text" : "Summarize Text"
                  }}
                </span>
              </button>
            </div>
          </div>

          <div
            class="flex-1 p-6 bg-gray-50 dark:bg-[#202020] flex flex-col relative"
          >
            <div
              class="absolute top-4 left-6 text-xs font-bold text-gray-400 uppercase tracking-wider"
            >
              Result
            </div>

            <div
              v-if="!resultText && !isLoading"
              class="flex-1 flex items-center justify-center text-gray-400 italic"
            >
              <p>Paraphrased text will appear here</p>
            </div>

            <div
              v-else
              class="flex-1 mt-6 overflow-y-auto prose prose-lg max-w-none text-gray-800 dark:text-gray-200 leading-relaxed custom-scrollbar"
            >
              {{ resultText }}
            </div>

            <div
              class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
              <span class="text-xs font-medium text-gray-400"
                >{{ resultCharacterCount }} characters</span
              >

              <div class="flex items-center gap-3">
                <!-- Speaker button -->
                <button
                  v-if="resultText && 'speechSynthesis' in window"
                  @click="readResult"
                  :class="[
                    'flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer',
                    isSpeaking
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-gray-500 hover:text-cyan-600',
                  ]"
                  :title="isSpeaking ? 'Stop reading' : 'Read aloud'"
                >
                  <!-- Stop icon when speaking -->
                  <svg
                    v-if="isSpeaking"
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 10h6v4H9z"
                    ></path>
                  </svg>
                  <!-- Volume icon when idle -->
                  <svg
                    v-else
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    ></path>
                  </svg>
                  {{ isSpeaking ? "Stop" : "Listen" }}
                </button>

                <!-- Copy button -->
                <button
                  v-if="resultText"
                  @click="copyToClipboard"
                  class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-cyan-600 transition-colors cursor-pointer"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    ></path>
                  </svg>
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for the text areas */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}
</style>
