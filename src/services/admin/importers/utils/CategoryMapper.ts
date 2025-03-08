import { logger } from '../../../../utils/logger';
import { universalTopics } from '../../../universalTopics';

export interface TopicMapping {
    subtopicId: string;
    topicId: string;
}

export class CategoryMapper {
    private static categoryMappings: { [key: string]: string } = {
        'משטחי עבודה, מדרכת מעבר ופתחים': 'משטחי עבודה, מדרכות מעבר ופתחים',
        'מכונות הרמה אחרות ואביזרי הרמה': 'מכונות ואביזרי הרמה',
        'תוכניות בטיחות': 'תכניות בטיחות',
        'גגות שבירים תלולים': 'גגות שבירים או תלולים',
        'הקמת מבנה מתכת': 'הקמת מבני מתכת',
        'שירות פיקוח על העבודה והמוס"ל': 'שרות פיקוח על העבודה והמוס"ל'
    };

    /**
     * Maps a Hebrew category to our normalized Hebrew category name
     */
    private static normalizeCategory(category: string): string {
        if (!category) return '';
        
        const mappedCategory = this.categoryMappings[category];
        if (mappedCategory) {
            logger.debug('Category normalized', { from: category, to: mappedCategory });
            return mappedCategory;
        }
        
        return category;
    }

    /**
     * Maps a Hebrew category to our topic structure
     * Returns the matching subtopic and its parent topic
     */
    static mapCategoryToTopic(category: string): TopicMapping {
        // First normalize the category name
        const normalizedCategory = this.normalizeCategory(category);
        
        // Get all topics and subtopics from UniversalTopics
        const allTopics = universalTopics.getTopicsForSubject('civil_engineering');
        
        // Try to find exact matching subtopic by Hebrew name
        for (const topic of allTopics) {
            for (const subtopic of topic.subTopics) {
                if (subtopic.name === normalizedCategory) {
                    logger.debug('Found topic mapping', {
                        category: normalizedCategory,
                        topicId: topic.id,
                        subtopicId: subtopic.id
                    });
                    return {
                        subtopicId: subtopic.id,
                        topicId: topic.id
                    };
                }
            }
        }

        // If no match found, throw error with category name
        throw new Error(`No matching subtopic found for category: ${category}`);
    }

    static addMapping(from: string, to: string): void {
        this.categoryMappings[from] = to;
        logger.debug('Added new category mapping', { from, to });
    }

    static getAllMappings(): { [key: string]: string } {
        return { ...this.categoryMappings };
    }
} 