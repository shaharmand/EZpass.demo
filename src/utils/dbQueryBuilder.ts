import { SupabaseClient } from '@supabase/supabase-js';

type JsonPath = string[];

export class DbQueryBuilder {
  private static buildJsonPath(path: JsonPath, extractText: boolean = true): string {
    // Start with data object
    let result = 'data';
    
    // Build the path with proper operators
    for (let i = 0; i < path.length; i++) {
      const isLast = i === path.length - 1;
      // Use ->> for the last segment if extractText is true, -> otherwise
      result += `${isLast && extractText ? '->>' : '->'}${path[i]}`;
    }
    
    return result;
  }

  static metadataField(field: string): string {
    return this.buildJsonPath(['metadata', field]);
  }

  static contentField(field: string): string {
    return this.buildJsonPath(['content', field]);
  }

  static applyMetadataFilter(query: any, field: string, value: any): any {
    return query.eq(this.metadataField(field), value);
  }

  static applyContentFilter(query: any, field: string, value: any): any {
    return query.eq(this.contentField(field), value);
  }
}

// Example usage:
// query = DbQueryBuilder.applyMetadataFilter(query, 'topicId', topicId);
// query = DbQueryBuilder.applyMetadataFilter(query, 'type', questionType); 