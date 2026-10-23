/** Reserve the tab during the click, then carry the iframe's identity to class rules. */
export async function openClassDetails(
  classId: number,
  issueExchangeToken: () => Promise<string>,
): Promise<void> {
  const tab = window.open('about:blank', '_blank');
  if (!tab) {
    throw new Error('popup-blocked');
  }
  tab.opener = null;
  try {
    const token = await issueExchangeToken();
    const params = new URLSearchParams({ to: 'class', classId: String(classId), token });
    tab.location.replace(`/obr-open?${params}`);
  } catch (error) {
    tab.close();
    throw error;
  }
}
