"use strict";

window.onload = function() {
    redraw();
};

function redraw() {
    redrawQueries();
    redrawPools();
}

function createLink(href, text) {
    var a = document.createElement("a");
    a.href = href;
    a.appendChild(document.createTextNode(text));
    return a;
}

function createSpan(classList, style, text) {
    var s = document.createElement("span");
    s.classList.add(...classList);
    s.style = style;
    s.appendChild(document.createTextNode(text));
    return s;
}

function normalizeLabelToClass(label) {
    // css class names cannot contain whitespace
    return label.replace(" ", "");
}

function redrawQueries() {
    var queries = document.getElementById("queries");
    while (queries.firstChild)
        queries.removeChild(queries.firstChild);

    if (!tideData.Queries) {
        return;
    }
    for (var i = 0; i < tideData.Queries.length; i++) {
        var query = tideData.Queries[i];
        var tideQuery = tideData.TideQueries[i];

        // create list entry for the query, all details will be within this element
        var li = document.createElement("li");

        // GitHub query search link
        var a = createLink(
            "https://github.com/search?utf8=" + encodeURIComponent("\u2713") + "&q=" + encodeURIComponent(query),
            "GitHub Search Link"
        );
        li.appendChild(a);

        // build the description
        // all queries should implicitly mean this
        var explanationPrefix = " - Meaning: Is an open Pull Request in one of the following repos: ";
        li.appendChild(document.createTextNode(explanationPrefix));
        var ul = document.createElement("ul");
        var innerLi = document.createElement("li");
        ul.appendChild(innerLi);
        li.appendChild(ul);
        // add the list of repos
        var repos = tideQuery["repos"];
        for (var j = 0; j < repos.length; j++) {
            innerLi.appendChild(createLink("https://github.com/" + repos[j], repos[j]));
            if (j+1 < repos.length) {
                innerLi.appendChild(document.createTextNode(", "));
            }
        }
        // required labels
        var hasLabels = tideQuery.hasOwnProperty("labels") && tideQuery["labels"].length > 0;
        if (hasLabels) {
            var labels = tideQuery["labels"];
            li.appendChild(createSpan(["emphasis"], "", "with"));
            li.appendChild(document.createTextNode(" the following labels: "));
            li.appendChild(document.createElement("br"));
            var ul = document.createElement("ul");
            var innerLi = document.createElement("li");
            ul.appendChild(innerLi);
            li.appendChild(ul);
            for (var j = 0; j < labels.length; j++) {
                var label = labels[j];
                innerLi.appendChild(createSpan(["label", normalizeLabelToClass(label)], "", label));
                if (j+1 < labels.length) {
                    innerLi.appendChild(document.createTextNode(" "));
                }
            }
        }
        // required to be not present labels
        var hasMissingLabels = tideQuery.hasOwnProperty("missingLabels") && tideQuery["missingLabels"].length > 0;
        if (hasMissingLabels) {
            var missingLabels = tideQuery["missingLabels"];
            if (hasLabels) {
                li.appendChild(createSpan(["emphasis"], "", "and without"));
            } else {
                li.appendChild(createSpan(["emphasis"], "", "without"));
            }
            li.appendChild(document.createTextNode(" the following labels: "));
            li.appendChild(document.createElement("br"));
            var ul = document.createElement("ul");
            var innerLi = document.createElement("li");
            ul.appendChild(innerLi);
            li.appendChild(ul);
            for (var j = 0; j < missingLabels.length; j++) {
                var label = missingLabels[j];
                innerLi.appendChild(createSpan(["label", normalizeLabelToClass(label)], "", label));
                if (j+1 < missingLabels.length) {
                    innerLi.appendChild(document.createTextNode(" "));
                }
            }
        }

        // GitHub native review required
        var reviewApprovedRequired = tideQuery.hasOwnProperty("reviewApprovedRequired") && tideQuery["reviewApprovedRequired"];
        if (reviewApprovedRequired) {
            li.appendChild(document.createTextNode("and must be "));
            li.appendChild(createLink(
                "https://help.github.com/articles/about-pull-request-reviews/",
                "approved by GitHub review"
            ));
        }

        // actually add the entry
        queries.appendChild(li);
    }
}

function redrawPools() {
    var pools = document.getElementById("pools").getElementsByTagName("tbody")[0];
    while (pools.firstChild)
        pools.removeChild(pools.firstChild);

    // TODO(spxtr): Sort these.
    if (!tideData.Pools) {
        return;
    }
    for (var i = 0; i < tideData.Pools.length; i++) {
        var pool = tideData.Pools[i];
        var r = document.createElement("tr");

        
        var deckLink = "/?repo="+pool.Org+"%2F"+pool.Repo;
        var repoLink = "https://github.com/" + pool.Org + "/" + pool.Repo + "/tree/" + pool.Branch;
        var linksTD = document.createElement("td");
        linksTD.appendChild(createLink(deckLink, pool.Org + "/" + pool.Repo));
        linksTD.appendChild(document.createTextNode(" "));
        linksTD.appendChild(createLink(repoLink, pool.Branch));
        r.appendChild(linksTD);
        r.appendChild(createActionCell(pool));
        r.appendChild(createPRCell(pool, pool.BatchPending));
        r.appendChild(createPRCell(pool, pool.SuccessPRs));
        r.appendChild(createPRCell(pool, pool.PendingPRs));
        r.appendChild(createPRCell(pool, pool.MissingPRs));

        pools.appendChild(r);
    }
}

function createLinkCell(text, url, title) {
    var c = document.createElement("td");
    var a = document.createElement("a");
    a.href = url;
    if (title !== "") {
        a.title = title;
    }
    a.appendChild(document.createTextNode(text));
    c.appendChild(a);
    return c;
}

function createActionCell(pool) {
    var action = pool.Action;
    var targetted = pool.Target && pool.Target.length
    var c = document.createElement("td");

    if (targetted) {
        action += ": "
    }
    c.appendChild(document.createTextNode(action));
    if (targetted) {
        addPRsToElem(c, pool, pool.Target)
    }
    return c;
}

function createPRCell(pool, prs) {
    var c = document.createElement("td");
    addPRsToElem(c, pool, prs)
    return c;
}

// addPRsToElem adds a space separated list of PR numbers that link to the corresponding PR on github.
function addPRsToElem(elem, pool, prs) {
    if (prs) {
        for (var i = 0; i < prs.length; i++) {
            var a = document.createElement("a");
            a.href = "https://github.com/" + pool.Org + "/" + pool.Repo + "/pull/" + prs[i].Number;
            a.appendChild(document.createTextNode("#" + prs[i].Number));
            elem.appendChild(a);
            // Add a space after each PR number except the last.
            if (i+1 < prs.length) {
                elem.appendChild(document.createTextNode(" "));
            }
        }
    }
}