document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("block-form");
    const websiteInput = document.getElementById("website");
    const durationInput = document.getElementById("duration");
    const blockedList = document.getElementById("blocked-list");
  
    // Function to remove a rule dynamically
    function removeRule(site) {
      chrome.declarativeNetRequest.getDynamicRules((rules) => {
        const ruleToRemove = rules.find((rule) => {
          if (rule && rule.condition && rule.condition.urlFilter) {
            // Match site with the rule's urlFilter
            const ruleDomain = rule.condition.urlFilter
              .replace(/\*/g, "") // Remove wildcards
              .replace(/\/$/, ""); // Remove trailing slash
            return site.includes(ruleDomain);
          }
          return false;
        });
  
        if (ruleToRemove) {
          chrome.declarativeNetRequest.updateDynamicRules(
            { addRules: [], removeRuleIds: [ruleToRemove.id] },
            () => {
              if (chrome.runtime.lastError) {
                console.error(
                  `Error removing rule for site ${site}:`,
                  chrome.runtime.lastError.message
                );
              } else {
                console.log(`Successfully removed rule for site: ${site}`);
              }
            }
          );
        } else {
          console.warn(`No matching rule found for site: ${site}`);
        }
      });
    }
  
    // Function to update the blocked list display
    function updateBlockedList(blockedSites) {
      blockedList.innerHTML = ""; // Clear current list
      blockedSites.forEach(({ site }) => {
        const li = document.createElement("li");
        li.textContent = site;
  
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.style.marginLeft = "10px";
        removeButton.style.backgroundColor = "green";
        removeButton.style.color = "white";
        removeButton.style.border = "none";
        removeButton.style.padding = "5px 10px";
        removeButton.style.cursor = "pointer";
  
        removeButton.addEventListener("click", () => handleRemoveSite(site));
        li.appendChild(removeButton);
        blockedList.appendChild(li);
      });
    }
  
    // Function to handle removing a site
    function handleRemoveSite(site) {
      chrome.storage.local.get(["blockedSites"], (result) => {
        const updatedSites = result.blockedSites.filter((entry) => entry.site !== site);
        chrome.storage.local.set({ blockedSites: updatedSites }, () => {
          updateBlockedList(updatedSites);
          removeRule(site); // Remove the dynamic rule
        });
      });
    }
  
    // Function to handle adding a site
    function handleAddSite(site, expiresAt) {
      chrome.storage.local.get(["blockedSites"], (result) => {
        const blockedSites = result.blockedSites || [];
        // Prevent duplicate entries
        if (!blockedSites.some((entry) => entry.site === site)) {
          blockedSites.push({ site, expiresAt });
          chrome.storage.local.set({ blockedSites }, () => {
            updateBlockedList(blockedSites);
          });
        } else {
          console.warn(`Site ${site} is already in the blocked list.`);
        }
      });
    }
  
    // Load initial blocked sites from storage
    chrome.storage.local.get(["blockedSites"], (result) => {
      updateBlockedList(result.blockedSites || []);
    });
  
    // Handle form submission
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const site = websiteInput.value.trim();
      const duration = parseInt(durationInput.value, 10);
  
      if (!site || isNaN(duration) || duration <= 0) {
        alert("Please enter a valid website and duration.");
        return;
      }
  
      // Calculate expiration time
      const expiresAt = Date.now() + duration * 60000;
  
      // Add the block rule
      chrome.runtime.sendMessage({ action: "addBlock", site, expiresAt }, (response) => {
        if (response.success) {
          handleAddSite(site, expiresAt);
          websiteInput.value = ""; // Clear input fields
          durationInput.value = "";
        } else {
          alert("Failed to add the block rule.");
        }
      });
    });
  });
  
  
  
  
  
  
  
  
  