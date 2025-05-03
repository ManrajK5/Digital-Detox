chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "addBlock") {
    const { site, expiresAt } = message;
    const domain = site.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

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

    chrome.declarativeNetRequest.updateDynamicRules(
      { addRules: [rule], removeRuleIds: [] },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error adding block rule:", chrome.runtime.lastError.message);
          sendResponse({ success: false });
        } else {
          console.log("Rule added for", domain);
          chrome.storage.local.get(["blockedSites"], (res) => {
            const blockedSites = res.blockedSites || [];
            blockedSites.push({ site, ruleId: rule.id, expiresAt });
            chrome.storage.local.set({ blockedSites });
          });
          sendResponse({ success: true });
        }
      }
    );

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
