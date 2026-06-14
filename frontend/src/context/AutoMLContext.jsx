import React, { createContext, useState, useContext } from 'react';

const AutoMLContext = createContext();

export const useAutoML = () => useContext(AutoMLContext);

export const AutoMLProvider = ({ children }) => {
    // Helper to initialize state from localStorage
    const getInitialState = (key, defaultValue) => {
        try {
            const saved = localStorage.getItem(key);
            if (!saved || saved === 'undefined') return defaultValue;
            return JSON.parse(saved);
        } catch (e) {
            console.error(`Error loading ${key} from localStorage`, e);
            return defaultValue;
        }
    };

    const [fileUrl, setFileUrlState] = useState(() => getInitialState('fileUrl', null));
    const [metadata, setMetadataState] = useState(() => getInitialState('metadata', null));
    const [targetColumn, setTargetColumnState] = useState(() => getInitialState('targetColumn', null));
    const [edaResults, setEdaResultsState] = useState(() => getInitialState('edaResults', null));
    const [trainResults, setTrainResultsState] = useState(() => getInitialState('trainResults', null));
    const [modelUrl, setModelUrlState] = useState(() => getInitialState('modelUrl', null));
    const [lastPrediction, setLastPredictionState] = useState(() => getInitialState('lastPrediction', null));
    const [lastPredictionInput, setLastPredictionInputState] = useState(() => getInitialState('lastPredictionInput', null));

    // Safe localStorage wrapper to prevent QuotaExceededError crashes
    const safeSetItem = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`[AutoMLContext] Failed to save ${key} to localStorage (likely QuotaExceededError). State retained in memory.`, e);
        }
    };

    // Wrappers to update both state and localStorage
    const setFileUrl = (value) => {
        setFileUrlState(value);
        safeSetItem('fileUrl', value);
    };
    const setMetadata = (value) => {
        setMetadataState(value);
        safeSetItem('metadata', value);
    };
    const setTargetColumn = (value) => {
        setTargetColumnState(value);
        safeSetItem('targetColumn', value);
    };
    const setEdaResults = (value) => {
        setEdaResultsState(value);
        safeSetItem('edaResults', value);
    };
    const setTrainResults = (value) => {
        setTrainResultsState(value);
        safeSetItem('trainResults', value);
    };
    const setModelUrl = (value) => {
        setModelUrlState(value);
        safeSetItem('modelUrl', value);
    };
    const setLastPrediction = (value) => {
        setLastPredictionState(value);
        safeSetItem('lastPrediction', value);
    };
    const setLastPredictionInput = (value) => {
        setLastPredictionInputState(value);
        safeSetItem('lastPredictionInput', value);
    };

    const value = {
        fileUrl, setFileUrl,
        metadata, setMetadata,
        targetColumn, setTargetColumn,
        edaResults, setEdaResults,
        trainResults, setTrainResults,
        modelUrl, setModelUrl,
        lastPrediction, setLastPrediction,
        lastPredictionInput, setLastPredictionInput
    };

    return (
        <AutoMLContext.Provider value={value}>
            {children}
        </AutoMLContext.Provider>
    );
};
