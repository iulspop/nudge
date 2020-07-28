var settingsLocal = {}

runSites()
async function runSites() {
  let settings = await loadSettingsRequest()
  settingsLocal = settings
  if (
    Array.isArray(settings.nudge_domains) &&
    Array.isArray(settings.whitelist_domains)
  ) {
    populateDomains(settings.nudge_domains)
    populateRecommendations(settings.nudge_domains)
    populateWhitelist(settings.whitelist_domains)
  }
}

function populateDomains(domains) {
  var domainsExist = false
  domains.forEach(function (key) {
    addTag(key, el("js-domainlist"), domainTagHandler)
    if (!domainsExist) {
      domainsExist = true
    }
  })
  if (!domainsExist) {
    el("js-empty-state").style.display = "flex"
    el("js-domainlist").style.display = "none"
  }
}

function populateRecommendations(domains) {
  topRecommendations.forEach(function (domain) {
    addTag(domain, el("js-toplist"), recommendationTagHandler, domains)
  })
  socialRecommendations.forEach(function (domain) {
    addTag(domain, el("js-sociallist"), recommendationTagHandler, domains)
  })
  newsRecommendations.forEach(function (domain) {
    addTag(domain, el("js-newslist"), recommendationTagHandler, domains)
  })
  messagingRecommendations.forEach(function (domain) {
    addTag(domain, el("js-messaginglist"), recommendationTagHandler, domains)
  })
  shoppingRecommendations.forEach(function (domain) {
    addTag(domain, el("js-shoppinglist"), recommendationTagHandler, domains)
  })
}

function populateWhitelist(domains) {
  domains.forEach(function (whitelistDomain) {
    addTag(whitelistDomain, el("js-whitelist"), whitelistTagHandler, domains)
  })
}

function addTag(domain, list, callback, domains) {
  var li = document.createElement("li")
  li.innerHTML = domain
  li.id = "li" + getRandomInt(1000, 10000000000000)
  li.setAttribute("domain", domain)
  list.appendChild(li)
  // Adjust the placeholder
  if (
    el("js-empty-state") &&
    list.id === "js-domainlist" &&
    el("js-empty-state").style.display != "none"
  ) {
    el("js-empty-state").style.display = "none"
    el("js-domainlist").style.display = "flex"
  }
  try {
    loadFavicon(li.id, domain)
  } catch (e) {
    log(e)
  }
  callback(li, domain, domains)
}

// Handle domain tag if you click remove
function domainTagHandler(li) {
  li.onclick = function () {
    const domain = li.getAttribute("domain")
    deleteEl(li)
    removeDomainFromSettings(domain)
    domainRecSelectToggle(domain)
  }
}

// Handle domain tag if you click remove
function whitelistTagHandler(li, domain) {
  li.onclick = function () {
    deleteEl(li)
    settingsLocal.whitelist_domains = settingsLocal.whitelist_domains.filter(
      function (value) {
        return value !== domain
      }
    )
    changeSettingRequest(settingsLocal.whitelist_domains, "whitelist_domains")
  }
}

// Handle domain tag if you click remove
function recommendationTagHandler(li, domain, domains) {
  var checkmark = document.createElement("div")
  toggleClass(checkmark, "checkmark")
  li.appendChild(checkmark)
  // Check if it's in the list above
  var selectedSite = false
  domains.forEach(function (nudgeDomain) {
    if (nudgeDomain === domain) {
      selectedSite = true
    }
  })

  if (selectedSite) {
    toggleClass(li, "selected-tag")
  }

  li.onclick = function () {
    if (li.className.includes("selected-tag")) {
      el("js-domainlist").childNodes.forEach(function (li) {
        if (li.getAttribute("domain") === domain) {
          deleteEl(li)
        }
      })
      removeDomainFromSettings(domain)
    } else {
      if (!settingsLocal.nudge_domains.includes(domain)) {
        // Don't do anything!
        // Add for the first time
        addTag(domain, el("js-domainlist"), domainTagHandler)
        el("js-empty-state").style.display = "none"
        el("js-domainlist").style.display = "block"
        addDomainToSettings(domain)
      }
    }
    toggleClass(li, "selected-tag")
    // Find the proper tag and remove it if necessary
  }
}

// Adding a new domain
el("js-add").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    var newDomainInput = el("js-add")
    var newDomain = el("js-add").value
    var domainList = el("js-domainlist")

    // Check
    if (
      domainTest.test(newDomain) &&
      !settingsLocal.nudge_domains.includes(newDomain)
    ) {
      addTag(newDomain, domainList, domainTagHandler)
      addDomainToSettings(newDomain)
      domainRecSelectToggle(newDomain)
      newDomainInput.value = ""
    }
    log(settingsLocal.nudge_domains)
  }
})

// Adding a new domain
if (el("js-whitelistadd")) {
  el("js-whitelistadd").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      var newDomain = el("js-whitelistadd").value
      if (whitelistTest.test(newDomain)) {
        if (settingsLocal.whitelist_domains.includes(newDomain)) {
          log(`Already exists, didn't add`)
        } else {
          addTag(newDomain, el("js-whitelist"), whitelistTagHandler)
          settingsLocal.whitelist_domains.push(newDomain)
          changeSettingRequest(
            settingsLocal.whitelist_domains,
            "whitelist_domains"
          )
          el("js-whitelistadd").value = ""
        }
      }
    }
  })
}

let showHiddenSections = false
el("js-whitelist-toggle").onclick = function () {
  toggleClass(el("js-whitelist-container"), "display-none")

  if (showHiddenSections) {
    showHiddenSections = false
    el("js-whitelist-toggle").innerHTML = "Choose whitelist sites"
  } else {
    showHiddenSections = true
    el("js-whitelist-toggle").innerHTML = "Hide whitelist sites"
  }
}

function domainRecSelectToggle(domain) {
  var lists = [
    "toplist",
    "sociallist",
    "newslist",
    "messaginglist",
    "shoppinglist",
  ]
  lists.forEach(function (list) {
    el(`js-${list}`).childNodes.forEach(function (node) {
      if (node.innerText === domain) {
        toggleClass(node, "selected-tag")
      }
    })
  })
}

// Utils
function removeDomainFromSettings(domain) {
  settingsLocal.nudge_domains = settingsLocal.nudge_domains.filter(
    (nudgeDomain) => {
      return nudgeDomain !== domain
    }
  )
  changeSettingRequest(settingsLocal.nudge_domains, "nudge_domains")
}

function addDomainToSettings(domain) {
  settingsLocal.nudge_domains.push(domain)
  changeSettingRequest(settingsLocal.nudge_domains, "nudge_domains")
}
