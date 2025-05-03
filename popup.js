document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("block-form");
  const websiteInput = document.getElementById("website");
  const durationInput = document.getElementById("duration");
  const blockedList = document.getElementById("blocked-list");

  function updateBlockedList(blockedSites) {
    blockedList.innerHTML = "";
    const now = Date.now();

    blockedSites.forEach(({ site, expiresAt }) => {
      const li = document.createElement("li");

      let minutesLeft = expiresAt ? Math.ceil((expiresAt - now) / 60000) : "∞";
      if (minutesLeft < 0) minutesLeft = 0;

      li.textContent = `${site} (${minutesLeft} min${minutesLeft !== 1 ? "s" : ""} left)`;

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

  function handleRemoveSite(site) {
    chrome.storage.local.get(["blockedSites"], (result) => {
      const blockedSites = result.blockedSites || [];
      const siteEntry = blockedSites.find((entry) => entry.site === site);

      if (siteEntry) {
        const updatedSites = blockedSites.filter((entry) => entry.site !== site);
        chrome.storage.local.set({ blockedSites: updatedSites }, () => {
          updateBlockedList(updatedSites);
          removeRuleById(siteEntry.ruleId);
        });
      }
    });
  }

  function removeRuleById(ruleId) {
    chrome.declarativeNetRequest.updateDynamicRules(
      { addRules: [], removeRuleIds: [ruleId] },
      () => {
        if (chrome.runtime.lastError) {
          console.error(`Failed to remove ruleId ${ruleId}: ${chrome.runtime.lastError.message}`);
        } else {
          console.log(`Successfully removed ruleId ${ruleId}`);
        }
      }
    );
  }

  function refreshBlockedList() {
    chrome.storage.local.get(["blockedSites"], (result) => {
      updateBlockedList(result.blockedSites || []);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const site = websiteInput.value.trim();
    const duration = parseInt(durationInput.value, 10);

    if (!site || isNaN(duration) || duration <= 0) {
      alert("Please enter a valid website and duration.");
      return;
    }

    const expiresAt = Date.now() + duration * 60000;

    chrome.runtime.sendMessage({ action: "addBlock", site, expiresAt }, (response) => {
      if (response.success) {
        setTimeout(refreshBlockedList, 500);
        websiteInput.value = "";
        durationInput.value = "";
      } else {
        alert("Failed to add the block rule.");
      }
    });
  });

  refreshBlockedList();
});
