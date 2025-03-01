import type { FilterState } from '../types/question';

export class UserFocus {
  private filters: FilterState;

  constructor(initialFilters: FilterState = {}) {
    this.filters = initialFilters;
  }

  // Set focus on a specific subtopic
  setSubtopicFocus(subtopicId: string) {
    this.filters = {
      ...this.filters,
      subTopics: [subtopicId]
    };
  }

  // Set focus on a specific topic
  setTopicFocus(topicId: string) {
    this.filters = {
      ...this.filters,
      topics: [topicId]
    };
  }

  // Set focus on a specific question type
  setTypeFocus(type: string) {
    this.filters = {
      ...this.filters,
      questionTypes: [type]
    };
  }

  // Remove focus from subtopic
  removeSubtopicFocus() {
    const { subTopics, ...rest } = this.filters;
    this.filters = rest;
  }

  // Remove focus from topic
  removeTopicFocus() {
    const { topics, ...rest } = this.filters;
    this.filters = rest;
  }

  // Remove focus from type
  removeTypeFocus() {
    const { questionTypes, ...rest } = this.filters;
    this.filters = rest;
  }

  // Clear all focus
  clearFocus() {
    this.filters = {};
  }

  // Get current filters
  getFilters(): FilterState {
    return { ...this.filters };
  }

  // Set complete filter state
  setFilters(filters: FilterState) {
    this.filters = { ...filters };
  }
} 