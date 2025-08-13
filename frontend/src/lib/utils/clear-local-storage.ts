export const clearUserLocalStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    // Model preference keys (current)
    localStorage.removeItem('leakerflow-preferred-model-v3');
    localStorage.removeItem('customModels');
    
    localStorage.removeItem('agent-selection-storage');
    
    localStorage.removeItem('auth-tracking-storage');
    
    localStorage.removeItem('pendingAgentPrompt');
    // Upgrade dialog flags (current)
    localStorage.removeItem('leakerflow_upgrade_dialog_displayed');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('maintenance-dismissed-')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ Local storage cleared on logout');
  } catch (error) {
    console.error('❌ Error clearing local storage:', error);
  }
}; 