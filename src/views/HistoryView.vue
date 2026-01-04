<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { auth } from "../stores/auth";
import { toast } from "../stores/toast";
import { confirm } from "../stores/confirm";

const router = useRouter();

// --- State ---
const activeTab = ref<"all" | "summaries" | "translations">("all");
const history = ref<any[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const perPage = ref(20);
const totalPages = ref(1);
const totalItems = ref(0);
const isDark = ref(true);
const selectedItems = ref<Set<string>>(new Set());
const isDeleting = ref(false);

// --- Computed ---
const displayedHistory = computed(() => {
  if (!history.value) return [];
  return history.value.map((item) => {
    const isTranslation = item.action_type === "translate";
    const isSummary = item.action_type === "summarize";

    return {
      ...item,
      isSelected: selectedItems.value.has(item.id),
      type: isTranslation ? "translation" : isSummary ? "summary" : item.type,
      displayDate: new Date(
        item.created_at || item.timestamp
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      // Map fields based on action_type
      input_text: item.original_text || item.input_text,
      result: isTranslation
        ? item.translated_text
        : isSummary
        ? item.summary_text
        : item.result,
    };
  });
});

const selectedCount = computed(() => selectedItems.value.size);
const allSelected = computed(
  () =>
    displayedHistory.value.length > 0 &&
    displayedHistory.value.length === selectedCount.value
);

// --- Methods ---
const fetchHistory = async () => {
  if (!auth.isAuthenticated()) {
    router.push("/login");
    return;
  }

  isLoading.value = true;
  try {
    let response;

    switch (activeTab.value) {
      case "summaries":
        response = await api.getHistorySummaries(
          currentPage.value,
          perPage.value
        );
        break;
      case "translations":
        response = await api.getHistoryTranslations(
          currentPage.value,
          perPage.value
        );
        break;
      default:
        response = await api.getHistory(currentPage.value, perPage.value);
    }

    // Handle paginated response
    if (response.data.items) {
      history.value = response.data.items;
      totalPages.value = response.data.pages || 1;
      totalItems.value = response.data.total || 0;
    } else if (Array.isArray(response.data)) {
      history.value = response.data;
      totalPages.value = 1;
      totalItems.value = response.data.length;
    } else {
      history.value = response.data.data || [];
      totalPages.value = response.data.pages || 1;
      totalItems.value = response.data.total || 0;
    }

    selectedItems.value.clear();
  } catch (error) {
    console.error("Error fetching history:", error);
    history.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleTabChange = (tab: "all" | "summaries" | "translations") => {
  activeTab.value = tab;
  currentPage.value = 1;
  selectedItems.value.clear();
  fetchHistory();
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedItems.value.clear();
  } else {
    displayedHistory.value.forEach((item) => {
      selectedItems.value.add(item.id);
    });
  }
};

const toggleSelect = (itemId: string) => {
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId);
  } else {
    selectedItems.value.add(itemId);
  }
};

const deleteItem = async (itemId: string) => {
  const item = history.value.find((h) => h.id === itemId);
  const isSummary = item?.action_type === "summarize";
  const itemType = isSummary ? "summary" : "translation";

  const confirmed = await confirm.show({
    title: "Delete Item",
    message: `Are you sure you want to delete this ${itemType}? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    type: "danger",
  });

  if (!confirmed) return;

  isDeleting.value = true;
  try {
    if (isSummary) {
      await api.deleteSummary(itemId);
    } else {
      await api.deleteTranslation(itemId);
    }
    await fetchHistory();
  } catch (error) {
    console.error("Error deleting item:", error);
    toast.error("Failed to delete item. Please try again.");
  } finally {
    isDeleting.value = false;
  }
};

const deleteSelected = async () => {
  if (selectedItems.value.size === 0) return;

  const confirmed = await confirm.show({
    title: "Delete Items",
    message: `Are you sure you want to delete ${selectedItems.value.size} item(s)? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    type: "danger",
  });
  if (!confirmed) return;

  isDeleting.value = true;
  const itemsToDelete = Array.from(selectedItems.value);

  try {
    await Promise.all(
      itemsToDelete.map((id) => {
        const item = history.value.find((h) => h.id === id);
        const isSummary = item?.action_type === "summarize";
        return isSummary ? api.deleteSummary(id) : api.deleteTranslation(id);
      })
    );
    selectedItems.value.clear();
    await fetchHistory();
  } catch (error) {
    console.error("Error deleting items:", error);
    toast.error("Failed to delete some items. Please try again.");
  } finally {
    isDeleting.value = false;
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard!");
};

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchHistory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchHistory();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const goToPage = (page: number) => {
  currentPage.value = page;
  fetchHistory();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// --- Lifecycle ---
onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  isDark.value =
    savedTheme === "dark" ||
    (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (!auth.isAuthenticated()) {
    router.push("/login");
  } else {
    fetchHistory();
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-white dark:bg-slate-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff09_1px,transparent_1px),linear-gradient(to_bottom,#ffffff09_1px,transparent_1px)] bg-[size:24px_24px]"
  >
    <!-- Header Section -->
    <div class="text-center pt-12 pb-8 px-4">
      <h1
        class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight"
      >
        History
      </h1>
      <p class="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
        View and manage your translation and summarization history
      </p>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 pb-20">
      <div
        class="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- Tabs & Controls -->
        <div
          class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#252525]"
        >
          <div class="px-6 py-4">
            <div
              class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <!-- Tab Buttons -->
              <div class="flex gap-2">
                <button
                  @click="handleTabChange('all')"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    activeTab === 'all'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer',
                  ]"
                >
                  All History
                </button>
                <button
                  @click="handleTabChange('summaries')"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    activeTab === 'summaries'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer',
                  ]"
                >
                  Summaries
                </button>
                <button
                  @click="handleTabChange('translations')"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    activeTab === 'translations'
                      ? 'bg-cyan-400 text-black shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer',
                  ]"
                >
                  Translations
                </button>
              </div>

              <!-- Delete Selected Button -->
              <button
                v-if="selectedCount > 0"
                @click="deleteSelected"
                :disabled="isDeleting"
                class="px-4 py-2 rounded-lg font-medium bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-500/30 disabled:opacity-50 transition-all duration-200"
              >
                Delete Selected ({{ selectedCount }})
              </button>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div class="p-6">
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-12">
            <div class="inline-block">
              <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"
              ></div>
            </div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">
              Loading history...
            </p>
          </div>

          <!-- Empty State -->
          <div v-else-if="history.length === 0" class="text-center py-12">
            <svg
              class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No {{ activeTab === "all" ? "" : activeTab }} history
            </h3>
            <p class="mt-1 text-gray-600 dark:text-gray-400">
              Start by creating a new
              {{
                activeTab === "summaries"
                  ? "summary"
                  : activeTab === "translations"
                  ? "translation"
                  : "summary or translation"
              }}.
            </p>
          </div>

          <!-- History List -->
          <div v-else class="space-y-3">
            <!-- Select All Checkbox -->
            <div
              v-if="history.length > 0"
              class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700"
            >
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-cyan-400 cursor-pointer"
              />
              <span
                class="text-sm font-medium text-gray-600 dark:text-gray-400"
              >
                {{ allSelected ? "Deselect All" : "Select All" }}
              </span>
            </div>

            <!-- History Items -->
            <div
              v-for="item in displayedHistory"
              :key="item.id"
              :class="[
                'flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border transition-all duration-200',
                item.isSelected
                  ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              ]"
            >
              <!-- Checkbox -->
              <div class="flex items-start gap-3 sm:w-auto">
                <input
                  type="checkbox"
                  :checked="item.isSelected"
                  @change="toggleSelect(item.id)"
                  class="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-cyan-400 cursor-pointer mt-1"
                />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <!-- Type Badge & Date -->
                <div class="flex items-center gap-2 mb-2">
                  <span
                    :class="[
                      'inline-flex px-3 py-1 rounded-full text-xs font-bold',
                      item.action_type === 'summarize'
                        ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
                    ]"
                  >
                    {{
                      item.action_type === "summarize"
                        ? "Summary"
                        : "Translation"
                    }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{
                    item.displayDate
                  }}</span>
                </div>

                <!-- Input Text -->
                <div v-if="item.input_text || item.original_text" class="mb-2">
                  <p
                    class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1"
                  >
                    Input:
                  </p>
                  <p
                    class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2"
                  >
                    {{ item.input_text || item.original_text }}
                  </p>
                </div>

                <!-- Target Language (for translations) -->
                <div
                  v-if="item.target_language || item.target_lang"
                  class="mb-2"
                >
                  <p
                    class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1"
                  >
                    Target Language:
                  </p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    {{ item.target_language || item.target_lang }}
                  </p>
                </div>

                <!-- Result/Output Text -->
                <div
                  v-if="item.result || item.output_text || item.translated_text"
                  class="mb-3"
                >
                  <p
                    class="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1"
                  >
                    Result:
                  </p>
                  <div
                    class="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                  >
                    <p
                      class="text-sm text-gray-800 dark:text-gray-200 line-clamp-3"
                    >
                      {{
                        item.result || item.output_text || item.translated_text
                      }}
                    </p>
                  </div>
                </div>

                <!-- Copy Button -->
                <button
                  @click="
                    copyToClipboard(
                      item.result ||
                        item.output_text ||
                        item.translated_text ||
                        ''
                    )
                  "
                  class="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                >
                  Copy Result
                </button>
              </div>

              <!-- Delete Button -->
              <div class="flex items-center gap-2 sm:w-auto">
                <button
                  @click="deleteItem(item.id)"
                  :disabled="isDeleting"
                  class="px-3 py-1 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#252525] px-6 py-4"
        >
          <div class="flex items-center justify-between gap-4">
            <button
              @click="goToPreviousPage"
              :disabled="currentPage === 1"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <!-- Page Numbers -->
            <div class="flex items-center gap-1">
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'bg-cyan-400 text-black font-bold'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600',
                ]"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="goToNextPage"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>

          <!-- Pagination Info -->
          <div
            class="text-center mt-3 text-xs text-gray-600 dark:text-gray-400"
          >
            Page {{ currentPage }} of {{ totalPages }} ({{ totalItems }} total
            items)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
input[type="checkbox"] {
  accent-color: rgb(34, 211, 238);
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
