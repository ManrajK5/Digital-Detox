chrome.storage.local.get(["blockedSites"], (result) => {
    const blockedSites = result.blockedSites || [];
    const currentURL = window.location.href;
  
    // Check if the current URL matches any blocked sites
    if (blockedSites.some(({ site }) => currentURL.includes(site))) {
      console.log(`Blocked site detected: ${currentURL}`);
      document.body.innerHTML = `
        <div style="text-align: center; margin-top: 20%; font-family: Arial, sans-serif;">
          <h1 style="font-size: 48px; color: red;">Access Blocked</h1>
          <p style="font-size: 24px;">This website is restricted as part of your digital detox journey.</p>
          <p style="font-size: 20px; color: #777;">Take a break and focus on something meaningful!</p>
        </div>
      `;
      document.title = "Blocked by Dopamine Detox";
    } else {
      console.log("No blocking rule matched. Content script exiting.");
    }
  });
  

