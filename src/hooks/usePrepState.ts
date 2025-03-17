import { useState, useEffect, useRef, useCallback } from 'react';
import { PrepStateManager } from '../services/PrepStateManager';
import type { StudentPrep } from '../types/prepState';

export function usePrepState(prepId: string, onPrepUpdate?: (prep: StudentPrep) => void) {
    const [prep, setPrep] = useState<StudentPrep | null>(null);
    const componentId = useRef(Math.random().toString(36).substring(2, 8));
    const renderCount = useRef(0);
    const callbackRef = useRef(onPrepUpdate);

    // Update callback ref when onPrepUpdate changes
    useEffect(() => {
        callbackRef.current = onPrepUpdate;
    }, [onPrepUpdate]);

    // Log initial render
    useEffect(() => {
        renderCount.current += 1;
        console.log('🎯 usePrepState - Component mounted:', {
            prepId,
            componentId: componentId.current,
            renderCount: renderCount.current,
            timestamp: new Date().toISOString()
        });

        return () => {
            console.log('👋 usePrepState - Component unmounted:', {
                prepId,
                componentId: componentId.current,
                renderCount: renderCount.current,
                timestamp: new Date().toISOString()
            });
        };
    }, [prepId]);

    // Log hook calls
    useEffect(() => {
        console.log('🔄 usePrepState - Hook called:', {
            prepId,
            componentId: componentId.current,
            renderCount: renderCount.current,
            hasCallback: !!callbackRef.current,
            timestamp: new Date().toISOString()
        });
    });

    // Create stable callback for subscription
    const handlePrepUpdate = useCallback((updatedPrep: StudentPrep) => {
        console.log('📨 usePrepState - Received update:', {
            prepId,
            componentId: componentId.current,
            renderCount: renderCount.current,
            topicsCount: updatedPrep.selection.subTopics.length,
            timestamp: new Date().toISOString()
        });

        setPrep(updatedPrep);
        
        if (callbackRef.current) {
            console.log('📤 usePrepState - Calling update callback:', {
                prepId,
                componentId: componentId.current,
                renderCount: renderCount.current,
                timestamp: new Date().toISOString()
            });
            callbackRef.current(updatedPrep);
        }
    }, [prepId]);

    // Subscribe to prep state changes
    useEffect(() => {
        console.log('🔌 usePrepState - Setting up subscription:', {
            prepId,
            componentId: componentId.current,
            renderCount: renderCount.current,
            timestamp: new Date().toISOString()
        });

        // Get initial prep state
        const initialPrep = PrepStateManager.getPrep(prepId);
        if (initialPrep) {
            setPrep(initialPrep);
        }

        // Subscribe to updates
        PrepStateManager.subscribeToPrepStateChanges(prepId, handlePrepUpdate);

        return () => {
            console.log('🔌 usePrepState - Cleaning up subscription:', {
                prepId,
                componentId: componentId.current,
                renderCount: renderCount.current,
                timestamp: new Date().toISOString()
            });
            PrepStateManager.unsubscribeFromPrepStateChanges(prepId, handlePrepUpdate);
        };
    }, [prepId, handlePrepUpdate]);

    return prep;
} 