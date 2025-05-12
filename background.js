// ==WEBSITE BLOCKING RULE== 
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "addBlock") {
    const { site, expiresAt } = message;

    // Extracts just the domain from the URL
    const domain = site.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
   
    // Creates a blocking rule with a redirect to /blocked.html
    const rule = {
      id: Math.floor(Math.random() * 100000),
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          extensionPath: "/blocked.html"
        }
      },
      condition: {
        urlFilter: `*://*.${domain}/*`,
        resourceTypes: ["main_frame"]
      }
    };
    
    // Adds the rule to Chrome's dynamic blocking system
    chrome.declarativeNetRequest.updateDynamicRules(
      { addRules: [rule], removeRuleIds: [] },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error adding block rule:", chrome.runtime.lastError.message);
          sendResponse({ success: false });
        } else {
          console.log("Rule added for", domain);

          // Saves rule to storage so it can be managed later
          chrome.storage.local.get(["blockedSites"], (res) => {
            const blockedSites = res.blockedSites || [];
            blockedSites.push({ site, ruleId: rule.id, expiresAt });
            chrome.storage.local.set({ blockedSites });
          });
          sendResponse({ success: true });
        }
      }
    );

    // Automatically removes the block rule when it expires
    const timeout = expiresAt - Date.now();
    setTimeout(() => {
      chrome.declarativeNetRequest.updateDynamicRules(
        { addRules: [], removeRuleIds: [rule.id] },
        () => {
          console.log("Rule removed for", domain);
        }
      );
      chrome.storage.local.get(["blockedSites"], (res) => {
        const updated = (res.blockedSites || []).filter((s) => s.ruleId !== rule.id);
        chrome.storage.local.set({ blockedSites: updated });
      });
    }, timeout);

    return true;
  }
});

// ==SCREEN TIME TRACKING RULE==
let currentDomain = null;

// Extracts domain from URL
function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

// Updates current active tab's domain
function updateCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0 && tabs[0].url) {
      currentDomain = getDomain(tabs[0].url);
    }
  });
}

// Listens for tab switch or URL change
chrome.tabs.onActivated.addListener(updateCurrentTab);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    currentDomain = getDomain(changeInfo.url);
  }
});

// Adds 1 second of screen time to current domain
setInterval(() => {
  if (!currentDomain) return;

  chrome.storage.local.get("screenTime", (data) => {
    const screenTime = data.screenTime || {};
    screenTime[currentDomain] = (screenTime[currentDomain] || 0) + 1;
    chrome.storage.local.set({ screenTime });
  });
}, 1000);

// Reset screen time at midnight
function resetAtMidnight() {
  const now = new Date();
  const millisUntilMidnight =
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

  setTimeout(() => {
    chrome.storage.local.set({ screenTime: {} });
    resetAtMidnight(); // re-arm
  }, millisUntilMidnight);
}

resetAtMidnight();