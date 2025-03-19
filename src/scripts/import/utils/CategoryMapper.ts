import { logger } from '../../../utils/logger';
import { universalTopics } from '../../../services/universalTopics';

export interface TopicMapping {
    subtopicId: string;
    topicId: string;
}

export class CategoryMapper {
    private static categoryMappings: { [key: string]: string } = {
        // Basic safety mappings
        'בטיחות כללית': 'general_safety',
        'בטיחות בעבודה': 'work_safety',
        'בטיחות בבנייה': 'construction_safety',
        'ציוד מגן אישי': 'personal_protection',
        'עבודה בגובה': 'work_at_height',
        'חומרים מסוכנים': 'hazardous_materials',
        'שירות פיקוח על העבודה והמוס"ל': 'work_inspection_service',
        
        // Safety management fundamentals
        'תכניות בטיחות': 'safety_planning',
        'תוכניות בטיחות': 'safety_planning',  // Alternative spelling
        
        // Construction methods and works
        'משטחי עבודה, מדרכות מעבר ופתחים': 'work_surfaces_walkways_and_openings',
        'משטחי עבודה\\, מדרכת מעבר ופתחים': 'work_surfaces_walkways_and_openings',  // Excel escaped version
        'משטחי עבודה, מדרכת מעבר ופתחים': 'work_surfaces_walkways_and_openings',    // Alternative spelling
        'הריסות וחומרי נפץ': 'demolition_and_explosives',
        'הריסות וחומרי פיצוץ': 'demolition_and_explosives',  // Alternative spelling
        'הקמת מבני מתכת': 'steel_construction',  // Steel construction mapping - plural form
        'הקמת מבנה מתכת': 'steel_construction',  // Steel construction mapping - singular form
        'טפסות': 'concrete_formwork',  // Concrete formwork mapping
        
        // Height work
        'גגות שבירים תלולים': 'fragile_or_steep_roofs',
        'גגות שבירים או תלולים': 'fragile_or_steep_roofs',  // Official name
        'גלישה, טיפוס תרנים והכשרה': 'rappelling_and_tower_climbing',  // Dedicated subtopic
        
        // Lifting and cranes
        'מכונות הרמה אחרות ואביזרי הרמה': 'lifting_equipment',
        'מכונות ואביזרי הרמה': 'lifting_equipment',  // Official name
        'מכונות הרמה אחרות ואביזרי': 'lifting_equipment'  // Truncated version
    };

    /**
     * Maps a Hebrew category to our topic structure
     * Returns the matching subtopic and its parent topic
     */
    static mapCategoryToTopic(category: string): TopicMapping {
        console.log('\n=== CategoryMapper: Mapping ===');
        console.log('Input Category:', category);
        
        // First normalize the category name
        const normalizedCategory = this.normalizeCategory(category);
        console.log('Normalized Category:', normalizedCategory);
        
        // First check if we have a direct mapping
        const mappedSubtopicId = this.categoryMappings[normalizedCategory];
        console.log('Direct Mapping Result:', mappedSubtopicId || 'No direct mapping found');
        
        if (mappedSubtopicId) {
            // Get all topics and subtopics from UniversalTopics
            const allTopics = universalTopics.getTopicsForSubject('civil_engineering');
            
            // Find the topic containing this subtopic
            for (const topic of allTopics) {
                const subtopic = topic.subTopics.find(st => st.id === mappedSubtopicId);
                if (subtopic) {
                    console.log('Found mapping in topic:', topic.id);
                    console.log('Subtopic ID:', subtopic.id);
                    console.log('Subtopic Name:', subtopic.name);
                    console.log('===========================\n');
                    
                    return {
                        subtopicId: subtopic.id,
                        topicId: topic.id
                    };
                }
            }
        }
        
        // If no mapping found, try to find by exact Hebrew name match
        console.log('Trying to find by exact Hebrew name match');
        const allTopics = universalTopics.getTopicsForSubject('civil_engineering');
        for (const topic of allTopics) {
            for (const subtopic of topic.subTopics) {
                if (subtopic.name === normalizedCategory) {
                    console.log('Found matching Hebrew name in topic:', topic.id);
                    console.log('Subtopic ID:', subtopic.id);
                    console.log('Subtopic Name:', subtopic.name);
                    console.log('===========================\n');
                    
                    return {
                        subtopicId: subtopic.id,
                        topicId: topic.id
                    };
                }
            }
        }

        console.log('No mapping found for category:', category);
        console.log('Available mappings:', Object.keys(this.categoryMappings).join(', '));
        console.log('===========================\n');

        // If no match found, throw error with category name
        throw new Error(`No matching subtopic found for category: ${category}`);
    }

    /**
     * Normalize category name by removing extra whitespace and diacritics
     */
    private static normalizeCategory(category: string): string {
        return category
            .trim()
            .replace(/\s+/g, ' ')
            .normalize('NFKD')
            .replace(/[\u0591-\u05C7]/g, ''); // Remove Hebrew diacritics
    }
} 