import { KnowledgeEntry, KnowledgeCategory, SearchResult, KnowledgeBaseStats } from "./types";

/**
 * Core knowledge base with BM25 text search.
 * Maintains inverted index, category index, and tag index for fast retrieval.
 */
export class KnowledgeBase {
  private entries: Map<string, KnowledgeEntry>;
  private invertedIndex: Map<string, Set<string>>; // term -> entry IDs
  private categoryIndex: Map<KnowledgeCategory, Set<string>>;
  private tagIndex: Map<string, Set<string>>;
  private documentLengths: Map<string, number>; // docId -> num tokens

  // BM25 parameters
  private k1 = 1.2;
  private b = 0.75;
  private avgDocLength = 0;

  constructor() {
    this.entries = new Map();
    this.invertedIndex = new Map();
    this.categoryIndex = new Map();
    this.tagIndex = new Map();
    this.documentLengths = new Map();

    // Initialize category index
    for (const cat of Object.values(KnowledgeCategory)) {
      this.categoryIndex.set(cat, new Set());
    }
  }

  addEntry(entry: KnowledgeEntry): void {
    this.entries.set(entry.id, entry);

    // Update category index
    const catSet = this.categoryIndex.get(entry.category);
    if (catSet) {
      catSet.add(entry.id);
    } else {
      this.categoryIndex.set(entry.category, new Set([entry.id]));
    }

    // Update tag index
    for (const tag of entry.tags) {
      const normalizedTag = tag.toLowerCase();
      if (!this.tagIndex.has(normalizedTag)) {
        this.tagIndex.set(normalizedTag, new Set());
      }
      this.tagIndex.get(normalizedTag)!.add(entry.id);
    }

    // Update inverted index
    const tokens = this.tokenize(`${entry.title} ${entry.content} ${entry.tags.join(" ")}`);
    this.documentLengths.set(entry.id, tokens.length);

    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(entry.id);
    }

    // Recompute average document length
    this.recomputeAvgDocLength();
  }

  getEntry(id: string): KnowledgeEntry | undefined {
    return this.entries.get(id);
  }

  removeEntry(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;

    // Remove from category index
    const catSet = this.categoryIndex.get(entry.category);
    if (catSet) catSet.delete(id);

    // Remove from tag index
    for (const tag of entry.tags) {
      const normalizedTag = tag.toLowerCase();
      const tagSet = this.tagIndex.get(normalizedTag);
      if (tagSet) tagSet.delete(id);
    }

    // Remove from inverted index
    const tokens = this.tokenize(`${entry.title} ${entry.content} ${entry.tags.join(" ")}`);
    for (const token of tokens) {
      const termSet = this.invertedIndex.get(token);
      if (termSet) termSet.delete(id);
    }

    this.documentLengths.delete(id);
    this.entries.delete(id);
    this.recomputeAvgDocLength();
    return true;
  }

  updateEntry(id: string, updates: Partial<KnowledgeEntry>): boolean {
    const existing = this.entries.get(id);
    if (!existing) return false;

    // Remove old indexes
    this.removeEntry(id);

    // Merge and re-add
    const updated: KnowledgeEntry = {
      ...existing,
      ...updates,
      id: existing.id, // Never change ID
      metadata: {
        ...existing.metadata,
        ...(updates.metadata ?? {}),
        updatedAt: new Date().toISOString(),
        version: existing.metadata.version + 1,
      },
    };

    this.addEntry(updated);
    return true;
  }

  /**
   * BM25 search across all entries.
   */
  search(
    query: string,
    options?: {
      limit?: number;
      category?: KnowledgeCategory;
      tags?: string[];
      minScore?: number;
    }
  ): SearchResult[] {
    const limit = options?.limit ?? 10;
    const minScore = options?.minScore ?? 0;
    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0) return [];

    // Determine candidate document set
    let candidateIds: Set<string>;
    if (options?.category) {
      candidateIds = new Set(this.categoryIndex.get(options.category) ?? []);
    } else {
      candidateIds = new Set(this.entries.keys());
    }

    // Further filter by tags if specified
    if (options?.tags && options.tags.length > 0) {
      const tagCandidates = new Set<string>();
      for (const tag of options.tags) {
        const normalizedTag = tag.toLowerCase();
        const tagSet = this.tagIndex.get(normalizedTag);
        if (tagSet) {
          for (const id of tagSet) {
            tagCandidates.add(id);
          }
        }
      }
      // Intersect
      const intersection = new Set<string>();
      for (const id of candidateIds) {
        if (tagCandidates.has(id)) intersection.add(id);
      }
      candidateIds = intersection;
    }

    // Score each candidate with BM25
    const results: SearchResult[] = [];

    for (const docId of candidateIds) {
      const score = this.computeBM25(queryTokens, docId);
      if (score <= minScore) continue;

      const entry = this.entries.get(docId);
      if (!entry) continue;

      // Find which query terms matched
      const docTokens = new Set(
        this.tokenize(`${entry.title} ${entry.content} ${entry.tags.join(" ")}`)
      );
      const matchedTerms = queryTokens.filter((t) => docTokens.has(t));

      results.push({ entry, score, matchedTerms });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  getByCategory(category: KnowledgeCategory): KnowledgeEntry[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];

    const results: KnowledgeEntry[] = [];
    for (const id of ids) {
      const entry = this.entries.get(id);
      if (entry) results.push(entry);
    }
    return results;
  }

  getByTag(tag: string): KnowledgeEntry[] {
    const normalizedTag = tag.toLowerCase();
    const ids = this.tagIndex.get(normalizedTag);
    if (!ids) return [];

    const results: KnowledgeEntry[] = [];
    for (const id of ids) {
      const entry = this.entries.get(id);
      if (entry) results.push(entry);
    }
    return results;
  }

  getByTags(tags: string[], matchAll: boolean = false): KnowledgeEntry[] {
    if (tags.length === 0) return [];

    const tagSets = tags.map((tag) => {
      const normalizedTag = tag.toLowerCase();
      return this.tagIndex.get(normalizedTag) ?? new Set<string>();
    });

    let resultIds: Set<string>;

    if (matchAll) {
      // Intersection of all tag sets
      resultIds = new Set(tagSets[0]);
      for (let i = 1; i < tagSets.length; i++) {
        const intersection = new Set<string>();
        for (const id of resultIds) {
          if (tagSets[i].has(id)) intersection.add(id);
        }
        resultIds = intersection;
      }
    } else {
      // Union of all tag sets
      resultIds = new Set<string>();
      for (const tagSet of tagSets) {
        for (const id of tagSet) {
          resultIds.add(id);
        }
      }
    }

    const results: KnowledgeEntry[] = [];
    for (const id of resultIds) {
      const entry = this.entries.get(id);
      if (entry) results.push(entry);
    }
    return results;
  }

  getStats(): KnowledgeBaseStats {
    const entriesByCategory: Record<string, number> = {};
    for (const [cat, ids] of this.categoryIndex) {
      entriesByCategory[cat] = ids.size;
    }

    // Count tags
    const tagCounts: Map<string, number> = new Map();
    for (const [tag, ids] of this.tagIndex) {
      tagCounts.set(tag, ids.size);
    }

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Average relevance score
    let totalRelevance = 0;
    for (const entry of this.entries.values()) {
      totalRelevance += entry.relevanceScore;
    }
    const averageRelevanceScore = this.entries.size > 0 ? totalRelevance / this.entries.size : 0;

    return {
      totalEntries: this.entries.size,
      entriesByCategory,
      topTags,
      averageRelevanceScore,
    };
  }

  // --- BM25 internals ---

  /**
   * Tokenize text into lowercase stemmed-like tokens.
   * Strips punctuation, splits on whitespace, removes stop words.
   */
  tokenize(text: string): string[] {
    const stopWords = new Set([
      "a",
      "an",
      "the",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "shall",
      "to",
      "of",
      "in",
      "for",
      "on",
      "with",
      "at",
      "by",
      "from",
      "as",
      "into",
      "through",
      "during",
      "before",
      "after",
      "over",
      "under",
      "above",
      "below",
      "between",
      "and",
      "but",
      "or",
      "not",
      "no",
      "nor",
      "so",
      "yet",
      "both",
      "either",
      "neither",
      "each",
      "every",
      "all",
      "any",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "than",
      "too",
      "very",
      "just",
      "also",
      "it",
      "its",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
      "my",
      "your",
      "his",
      "our",
      "their",
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1 && !stopWords.has(token));
  }

  /**
   * Compute BM25 score for a query against a document.
   */
  private computeBM25(queryTokens: string[], docId: string): number {
    const docLength = this.documentLengths.get(docId) ?? 0;
    if (docLength === 0) return 0;

    const N = this.entries.size;
    let score = 0;

    // Count term frequencies in document
    const entry = this.entries.get(docId);
    if (!entry) return 0;

    const docTokens = this.tokenize(`${entry.title} ${entry.content} ${entry.tags.join(" ")}`);
    const termFreq = new Map<string, number>();
    for (const token of docTokens) {
      termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
    }

    for (const term of queryTokens) {
      const df = this.getDocumentFrequency(term);
      if (df === 0) continue;

      // IDF component: log((N - df + 0.5) / (df + 0.5) + 1)
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

      // TF component
      const tf = termFreq.get(term) ?? 0;
      if (tf === 0) continue;

      const tfNorm =
        (tf * (this.k1 + 1)) /
        (tf + this.k1 * (1 - this.b + this.b * (docLength / (this.avgDocLength || 1))));

      score += idf * tfNorm;
    }

    // Boost by entry relevance score
    score *= 0.7 + 0.3 * (entry.relevanceScore ?? 0.5);

    return score;
  }

  private getDocumentFrequency(term: string): number {
    const docSet = this.invertedIndex.get(term);
    return docSet ? docSet.size : 0;
  }

  private recomputeAvgDocLength(): void {
    if (this.documentLengths.size === 0) {
      this.avgDocLength = 0;
      return;
    }
    let total = 0;
    for (const length of this.documentLengths.values()) {
      total += length;
    }
    this.avgDocLength = total / this.documentLengths.size;
  }

  private buildInvertedIndex(): void {
    this.invertedIndex.clear();
    this.documentLengths.clear();

    for (const [id, entry] of this.entries) {
      const tokens = this.tokenize(`${entry.title} ${entry.content} ${entry.tags.join(" ")}`);
      this.documentLengths.set(id, tokens.length);

      for (const token of tokens) {
        if (!this.invertedIndex.has(token)) {
          this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token)!.add(id);
      }
    }

    this.recomputeAvgDocLength();
  }

  // --- Serialization ---

  toJSON(): KnowledgeEntry[] {
    return Array.from(this.entries.values());
  }

  static fromJSON(entries: KnowledgeEntry[]): KnowledgeBase {
    const kb = new KnowledgeBase();
    for (const entry of entries) {
      kb.addEntry(entry);
    }
    return kb;
  }

  get size(): number {
    return this.entries.size;
  }
}
