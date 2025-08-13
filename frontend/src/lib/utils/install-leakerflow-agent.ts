"use server";

async function installLeakerflowForNewUser(userId: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    // Require new env var only (legacy removed)
    const adminApiKey = process.env.LEAKERFLOW_ADMIN_API_KEY;
    
    if (!adminApiKey) {
      console.error('LEAKERFLOW_ADMIN_API_KEY not configured - cannot install Leaker Flow agent');
      return;
    }
    if (!backendUrl) {
      console.error('NEXT_PUBLIC_BACKEND_URL not configured - cannot install Leaker Flow agent');
      return;
    }

    // Use new endpoint only (legacy removed)
    const newEndpoint = `${backendUrl}/admin/leakerflow-agents/install-user/${userId}`;

    const doRequest = async (url: string) => fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Api-Key': adminApiKey,
      },
    });

    const response = await doRequest(newEndpoint);

    if (response.ok) {
      const result = await response.json();
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to install Leaker Flow agent for user:`, errorData);
      return false;
    }
  } catch (error) {
    console.error('Error installing Leaker Flow agent for new user:', error);
    return false;
  }
}

export async function checkAndInstallLeakerflowAgent(userId: string, userCreatedAt: string) {
  const userCreatedDate = new Date(userCreatedAt);
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  if (userCreatedDate > tenMinutesAgo) {
    const installKey = `leakerflow-agent-install-attempted-${userId}`;
    if (typeof window !== 'undefined' && localStorage.getItem(installKey)) {
      return;
    }
    
    const success = await installLeakerflowForNewUser(userId);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(installKey, Date.now().toString());
    }
    
    return success;
  }
  
  return false;
}
