chrome.storage.local.get(["blockedSites"], (result) => {
  const blockedSites = result.blockedSites || [];
  const currentURL = window.location.href;

  const matchedSite = blockedSites.find(({ site }) => {
    const domain = site.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    return currentURL.includes(domain);
  });
// Redirect to block screen of david goggins if user clicks on blocked website
  if (matchedSite) {
    console.log(`Blocked site detected: ${currentURL}`);
    window.location.href = chrome.runtime.getURL("blocked.html");
  } else {
    console.log("No blocking rule matched. Content script exiting.");
  }
});
