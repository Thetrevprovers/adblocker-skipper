(function () {
  'use strict';

  const whitelist = [];
  const blacklist = ["._m8c", ".uiStreamSponsoredLink", 'a[data-hovercard][href*="hc_ref=ADS"]', 'a[role="button"][rel~="noopener"][data-lynx-mode="async"]'];
  const sponsoredTexts = ["Sponsored", "مُموَّل",
  "赞助内容",
  "贊助",
  "Sponzorováno",
  "Gesponsord",
  "May Sponsor",
  "Sponsorisé",
  "Gesponsert",
  "Χορηγούμενη",
  "ממומן",
  "प्रायोजित",
  "Bersponsor",
  "Sponsorizzato",
  "Sponsorowane",
  "Patrocinado",
  "Реклама",
  "Sponzorované",
  "Publicidad",
  "ได้รับการสนับสนุน",
  "Sponsorlu",
  "Được tài trợ"
  ];

  function isHidden(e) {
    const style = window.getComputedStyle(e);
    if (style.display === "none" || style.opacity === "0" || style.fontSize === "0px" || style.visibility === "hidden" || style.position === "absolute") {
      return true;
    }
    return false;
  }
  function getTextFromElement(e) {
    return (e.innerText === "" ? e.dataset.content : e.innerText) || "";
  }
  function getTextFromContainerElement(e) {
    return e.dataset.content || Array.prototype.filter.call(e.childNodes, element => {
      return element.nodeType === Node.TEXT_NODE;
    }).map(element => {
      return element.textContent;
    }).join("");
  }
  function getVisibleText(e) {
    if (isHidden(e)) {
      return "";
    }
    const children = e.querySelectorAll(":scope > *");
    if (children.length !== 0) {
      return getTextFromContainerElement(e) + Array.prototype.slice.call(children).map(getVisibleText).flat().join("");
    }
    return getTextFromElement(e);
  }
  function hideIfSponsored(possibleSponsoredTextQueries, e) {
    if (whitelist.some(query => {
      if (e.querySelector(query) !== null) {
        e.dataset.blocked = "whitelist";
        console.info(`Ignored (${query})`, [e]);
        return true;
      }
      return false;
    })) {
      return false;
    }
    if (blacklist.some(query => {
      if (e.querySelector(query) !== null) {
        e.style.display = "none";
        e.dataset.blocked = "blacklist";
        console.info(`AD Blocked (${query})`, [e]);
        return true;
      }
      return false;
    })) {
      return true;
    }
    return possibleSponsoredTextQueries.some(query => {
      const result = e.querySelectorAll(query);
      return [...result].some(t => {
        const visibleText = getVisibleText(t);
        if (sponsoredTexts.some(sponsoredText => visibleText.indexOf(sponsoredText) !== -1)) {
          e.style.display = "none";
          e.dataset.blocked = "sponsored";
          console.info(`AD Blocked (query='${query}', visibleText='${visibleText}')`, [e]);
          return true;
        }
        return false;
      });
    });
  }

  const possibleSponsoredTextQueries = ['div[id^="feedsubtitle"] > :first-child', 'div[id^="feed_sub_title"] > :first-child', 'div[id^="feed__sub__title"] > :first-child', 'div[id^="feedlabel"] > :first-child', 'div[id^="fbfeed_sub_header_id"] > :nth-child(3)', 'div[data-testid$="storysub-title"] > :first-child', 'div[data-testid$="story-subtilte"] > :first-child', 'div[data-testid$="story--subtilte"] > :first-child', 'a[role="button"][aria-labelledby]', 'div[data-testid*="subtitle"] > :first-child', 'div[data-testid*="label"] > :first-child'];
  function hideIfSponsored$1(e) {
    return hideIfSponsored(possibleSponsoredTextQueries, e);
  }
  let feedObserver = null;
  function onPageChange() {
    let feed = document.getElementById("stream_pagelet");
    if (feed !== null) {
      feed.querySelectorAll('div[id^="hyperfeed_story_id_"]').forEach(hideIfSponsored$1);
      feedObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.target.id.startsWith("hyperfeed_story_id_")) {
            hideIfSponsored$1(mutation.target);
          }
        });
      });
      feedObserver.observe(feed, {
        childList: true,
        subtree: true
      });
      console.info("Monitoring feed updates", [feed]);
      return;
    }
    feed = document.getElementById("pagelet_group_");
    if (feed !== null) {
      feed.querySelectorAll('div[id^="mall_post_"]').forEach(hideIfSponsored$1);
      feedObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.target.querySelectorAll('div[id^="mall_post_"]').forEach(hideIfSponsored$1);
        });
      });
      feedObserver.observe(feed, {
        childList: true,
        subtree: true
      });
      console.info("Monitoring feed updates", [feed]);
    }
  }
  const pageObserver = new MutationObserver(onPageChange);
  function setupPageObserver() {
    onPageChange();
    const fbContent = document.getElementsByClassName("fb_content")[0];
    pageObserver.observe(fbContent, {
      childList: true
    });
    console.info("Monitoring page changes", [fbContent]);
  }
  window.addEventListener("beforeunload", () => {
    pageObserver.disconnect();
    if (feedObserver !== null) {
      feedObserver.disconnect();
      feedObserver = null;
    }
  });
  function isClassicFacebook() {
    return document.getElementsByClassName("fb_content")[0] !== undefined;
  }

  const possibleSponsoredTextQueries$1 = ['a[role="link"] > span[aria-labelledby]', 'div[role="button"] > span[aria-labelledby]'];
  function hideIfSponsored$2(e) {
    return hideIfSponsored(possibleSponsoredTextQueries$1, e);
  }
  let feedObserver$1 = null;
  function setFeedObserver() {
    const feed = document.querySelector("div[role=feed]:not([data-adblock-monitored])");
    if (feed !== null) {
      feed.querySelectorAll('div[data-pagelet^="FeedUnit_"]').forEach(hideIfSponsored$2);
      const feedContainer = feed.parentNode;
      feed.dataset.adblockMonitored = true;
      feedObserver$1 = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.target === feedContainer && mutation.addedNodes.length > 0) {
            feedObserver$1.disconnect();
            setTimeout(setFeedObserver, 0);
          }
          if (mutation.target === feed && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(node => {
              if (node.dataset.pagelet && node.dataset.pagelet.startsWith("FeedUnit_")) {
                hideIfSponsored$2(node);
              }
            });
          }
        });
      });
      feedObserver$1.observe(feed, {
        childList: true
      });
      feedObserver$1.observe(feedContainer, {
        childList: true
      });
      console.info("Monitoring feed updates", [feed]);
    } else {
      setTimeout(setFeedObserver, 1000);
    }
  }
  function onPageChange$1() {
    if (document.querySelector("div[role=feed]:not([data-adblock-monitored])") !== null) {
      setFeedObserver();
      return;
    }
    if (document.getElementById("suspended-feed") !== null) {
      setFeedObserver();
      return;
    }
    if (feedObserver$1 !== null && document.querySelector("div[role=feed][data-adblock-monitored]") === null) {
      feedObserver$1.disconnect();
      feedObserver$1 = null;
    }
  }
  const pageObserver$1 = new MutationObserver(onPageChange$1);
  function setupPageObserver$1() {
    const pageDiv = document.querySelector("div[data-pagelet=root] div[data-pagelet=page]");
    if (pageDiv !== null) {
      onPageChange$1();
      pageObserver$1.observe(pageDiv.parentNode, {
        childList: true
      });
      console.info("Monitoring page changes", [pageDiv]);
    } else {
      setTimeout(setupPageObserver$1, 1000);
    }
  }
  window.addEventListener("beforeunload", () => {
    pageObserver$1.disconnect();
    if (feedObserver$1 !== null) {
      feedObserver$1.disconnect();
      feedObserver$1 = null;
    }
  });
  function isFB5() {
    return document.getElementById("mount_0_0") !== null;
  }

  if (isClassicFacebook()) {
    setupPageObserver();
  } else if (isFB5()) {
    setupPageObserver$1();
  } else {
    console.warn("Page element not found! If this is not a mobile Facebook, please file a bug report: https://github.com/tiratatp/facebook_adblock/issues/new");
  }

}());
