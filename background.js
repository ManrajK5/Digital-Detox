chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "addBlock") {
      const { site, expiresAt } = message;
  
      const domain = site.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
      const rules = [
        {
          id: Math.floor(Math.random() * 100000),
          priority: 1,
          action: { type: "block" },
          condition: { urlFilter: `*://*.${domain}/*`, resourceTypes: ["main_frame"] }
        }
      ];
  
      chrome.declarativeNetRequest.updateDynamicRules(
        { addRules: rules, removeRuleIds: [] },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Error adding block rules:", chrome.runtime.lastError.message);
            sendResponse({ success: false });
          } else {
            console.log(`Rules added for ${site}:`, rules);
  
            chrome.storage.local.get(["blockedSites"], (result) => {
              const blockedSites = result.blockedSites || [];
              blockedSites.push({ site, ruleId: rules[0].id, expiresAt });
              chrome.storage.local.set({ blockedSites });
            });
  
            sendResponse({ success: true });
          }
        }
      );
  
      // Set a timer to remove the block after the duration expires
      const timeout = expiresAt - Date.now();
      setTimeout(() => {
        const ruleIds = rules.map((rule) => rule.id);
  
        console.log(`Attempting to remove rule IDs: ${ruleIds.join(", ")}`);
  
        chrome.declarativeNetRequest.updateDynamicRules(
          { addRules: [], removeRuleIds: ruleIds },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                `Failed to remove rule IDs ${ruleIds.join(", ")}: ${chrome.runtime.lastError.message}`
              );
            } else {
              console.log(`Successfully removed rule IDs: ${ruleIds.join(", ")}`);
            }
          }
        );
  
        // Remove expired rules from storage
        chrome.storage.local.get(["blockedSites"], (result) => {
          const blockedSites = result.blockedSites || [];
          const updatedSites = blockedSites.filter((entry) => !ruleIds.includes(entry.ruleId));
  
          chrome.storage.local.set({ blockedSites: updatedSites }, () => {
            console.log("Updated blockedSites after storage cleanup:", updatedSites);
          });
        });
      }, timeout);
  
      return true;
    }
  });
  
  // Debugging function to log active dynamic rules
  function logActiveRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      console.log("Active Dynamic Rules:", rules);
    });
  }
  
  // Clear all dynamic rules (useful for debugging)
  function clearAllRules() {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      const ruleIds = rules.map((rule) => rule.id);
      chrome.declarativeNetRequest.updateDynamicRules(
        { addRules: [], removeRuleIds: ruleIds },
        () => {
          console.log("All rules cleared.");
        }
      );
    });
  }
  
  // Call debug functions if needed
  logActiveRules();
  
  