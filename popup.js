document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("block-form");
  const websiteInput = document.getElementById("website");
  const durationInput = document.getElementById("duration");
  const blockedList = document.getElementById("blocked-list");


  // ==BLOCKING FUNCTIONALITY==
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

// ==SCREEN TIME TRACKING==
function formatMinutes(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function renderScreenTime(showAll = false) {
  chrome.storage.local.get("screenTime", (data) => {
    const stats = data.screenTime || {};
    const list = document.getElementById("screen-time-list");
    list.innerHTML = "";

    let flatData = stats;
    if (
      Object.keys(stats).length === 1 &&
      typeof Object.values(stats)[0] === "object"
    ) {
      flatData = Object.values(stats)[0];
    }

    const ignoreList = ["newtab", "extensions", "devtools", "chrome"];
    const filtered = Object.entries(flatData).filter(([domain, seconds]) => {
      const isDateKey = /^\d{4}-\d{2}-\d{2}$/.test(domain);
      const isInvalid = typeof seconds !== "number" || isNaN(seconds);
      return !isDateKey && !ignoreList.includes(domain) && !isInvalid;
    });

    const sorted = filtered.sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      list.innerHTML = "<li>No screen time data yet.</li>";
      return;
    }

    const itemsToShow = showAll ? sorted : sorted.slice(0, 3);

    itemsToShow.forEach(([domain, seconds]) => {
      const li = document.createElement("li");
    
      // Create domain label
      const span = document.createElement("span");
      span.textContent = `${domain}: ${formatMinutes(seconds)}`;
    
      // Create Block button
      const blockBtn = document.createElement("button");
      blockBtn.textContent = "Block";
      blockBtn.style.marginLeft = "10px";
      blockBtn.style.padding = "4px 8px";
      blockBtn.style.border = "none";
      blockBtn.style.borderRadius = "6px";
      blockBtn.style.backgroundColor = "#dc3545";
      blockBtn.style.color = "white";
      blockBtn.style.cursor = "pointer";
      blockBtn.style.fontSize = "12px";
    
      // When clicked, auto-submit the block form
      blockBtn.addEventListener("click", () => {
        document.getElementById("website").value = domain;
        document.getElementById("duration").value = 10; // default duration
        document.getElementById("block-form").requestSubmit();
      });
    
      li.appendChild(span);
      li.appendChild(blockBtn);
      list.appendChild(li);
    });

    // Add toggle button
    if (sorted.length > 3) {
      const toggleButton = document.createElement("li");
      toggleButton.textContent = showAll ? "Hide" : `+${sorted.length - 3} more...`;
      toggleButton.style.fontStyle = "italic";
      toggleButton.style.cursor = "pointer";
      toggleButton.style.color = "#1e4da1";
      toggleButton.addEventListener("click", () => renderScreenTime(!showAll));
      list.appendChild(toggleButton);
    }
  });
}
renderScreenTime();
});
