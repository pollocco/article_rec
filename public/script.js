//Global bois
var isLoadingBar = false
const PAGE_SIZE = 5
var indexCount = 0
var pagNav = makeNode("nav", [{"className":"pagination"}])
var nextPage = makeNode("a", [{"textContent":"Next"}, {"className":"pagination-next"}])
var prevPage = makeNode("a", [{"className":"pagination-previous"}, {"textContent":"Previous"}])
prevPage.style.visibility = "hidden";
nextPage.style.visibility = "visible";
//End Global bois

//Entry Point
document.addEventListener("DOMContentLoaded", async function(){
  var sources = await getReq("/api/getTopicArticleSources")
  makeFilters(sources)
  makeLoadingBar(10, "Booting up the mainframe...")
  var topics = await getReq("/api/getTopics")
  var checkboxes = makeTopicsTable(topics)
  getUserTopics(checkboxes)
  var userHistory = await getReq("/api/getUserArticlesHistory")
  makeUserArticleHistorySidebar(userHistory)
  bindResetButton()
})
//End Entry Point

async function getTopicArticlesWithConcatTopics(){
  var allTopicsResponse = await getReq('/api/getTopicArticlesWithConcatTopics')
}

async function postReq(url='', data={}){
  const response = await fetch(url,{
    method: "POST",
    headers:{
      'Content-Type':'application/json'
    },
    body: JSON.stringify(data)
  })
  
  return response.json()
}

async function getReq(url=''){
  const response = await fetch(url)
  return response.json()
}

async function getUserTopics(checkboxes) {
  setLoadingBar(30, "Fetching user topics...");
  var response = await getReq('/api/getUserTopics')
  if(response.length > 0){
    setUserBoxes(response, checkboxes)
    getTopicArticles()
  } else{
    displayNoArticles()
  }
}

async function toggleUserArticle(likeButton) {
  let jsonObj = {
    articleId: likeButton.articleId,
  };
  var response = await postReq('/api/toggleUserArticle', jsonObj).catch(e=>{console.log(e)})
  if(response.length > 0){
    var history = await getReq('/api/getUserArticlesHistory').catch(e=>{console.log(e)});
    makeUserArticleHistorySidebar(history)
  }
  return;
}

async function toggleUserTopic(checkbox) {
  var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
    {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
  checkbox.cell.replaceChild(loader, checkbox)
  let jsonObj = {
    topicId: checkbox.topicId,
  };
  var response = await postReq("/api/toggleTopic", jsonObj)
  checkbox.cell.replaceChild(checkbox, loader)
  checkbox.checked = !checkbox.checked
  if(response.length > 0){
    getTopicArticles()
  } else{
    displayNoArticles();
  }
  return;
}

function switchToAuthorFilter(authorTable, periodicalTable){                  // Switches to the author filter table. Keeps the checkboxes
  var sourcesTab = document.querySelector("#sourcesTab")                      // for the periodical filter so that the filtering still
  sourcesTab.addEventListener("click", function(){                            // reflects both periodicals and authors.
    switchToPeriodicalFilter(periodicalTable, authorTable)
  })
  if(sourcesTab.classList.contains("is-active")){
    sourcesTab.classList.remove("is-active")
  }
  authorsTab.classList.add("is-active")
  var periodicalFilter = document.querySelector("#periodicalFilter")
  periodicalFilter.replaceChild(authorTable, periodicalFilter.children[0])
}

function switchToPeriodicalFilter(periodicalTable, authorTable){                // Switches back to the periodical filter. Same as above, pretty much.
  var authorsTab = document.querySelector("#authorsTab")
  authorsTab.addEventListener("click", function(){
    switchToAuthorFilter(authorTable, periodicalTable)
  })
  if(authorsTab.classList.contains("is-active")){                               // This is the highlight that gets applied to the tabs at the top of the panel.
    authorsTab.classList.remove("is-active")
  }
  sourcesTab.classList.add("is-active")
  var periodicalFilter = document.querySelector("#periodicalFilter")
  periodicalFilter.replaceChild(periodicalTable, periodicalFilter.children[0])
}

async function toggleFilters(checkboxes, checkbox, authorCheckboxes){
  makeLoadingBar(90, "Updating...")
  var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
    {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
  checkbox.cell.replaceChild(loader, checkbox)
  var periodicalIds = []
  var articleIds = []
  var authorIds = []
  for(i=0;i<authorCheckboxes.length;i++){
    if(authorCheckboxes[i].checked == true){
      authorIds.push(authorCheckboxes[i].authorId)
    }
  }
  for(i=0;i<checkboxes.length;i++){
    if(checkboxes[i].checked == true){
      periodicalIds.push(checkboxes[i].periodicalId)
    }
  }
  var topicArticles = await getReq("/api/getTopicArticlesWithConcatTopics")
  for(i=0; i<topicArticles.length;i++){
    articleIds.push(topicArticles[i].articleId)
  }
  var jsonObj = {}
  jsonObj["periodicalIds"] = periodicalIds
  jsonObj["articleIds"] = articleIds
  jsonObj["authorIds"] = authorIds
  var response = await postReq("/api/getTopicArticlesFiltered", jsonObj)
  setLoadingBar(99, "Almost there!")
  indexCount = 0;
  checkbox.cell.replaceChild(checkbox, loader)
  generateArticlesList(response, PAGE_SIZE)
  for(i=0;i<checkboxes.length;i++){
    checkboxes[i].checked = false;
  }
  for(i=0;i<response.length;i++){
    for(j=0;j<checkboxes.length;j++){
      if(response[i].periodicalId == checkboxes[j].periodicalId){
        checkboxes[j].checked = true;
      }
    }
  }
}

async function makeFilters(response){                                     // This makes the author and periodical filter tables/checkboxes.
    var checkboxes = []                                                   // Because they're dependent on each other, I wasn't able to get them to 
    checkboxes.response = response;                                       // be initialized in separate functions without losing scope.
    var periodicalTable = document.createElement("Table");
    let thead = periodicalTable.createTHead();
    for (i = 0; i < response.length; i++) {
      let row = thead.insertRow();
      row.classList.add("periodicalRow");

      let nameCell = row.insertCell();
      let nameCellText = makeNode("label", [{"innerText":`${response[i].periodicalName}`}])
      nameCell.appendChild(nameCellText);

      let numberOfArticles = row.insertCell();
      let numberOfArticlesText = makeNode("label", [{"innerText":`${response[i].numberOfArticles}`}])
      numberOfArticles.appendChild(numberOfArticlesText);

      let checkboxCell = row.insertCell();

      checkboxes[i] = function(x){
          return checkbox = makeNode("input", [{"type":"checkbox"}, {"cell":checkboxCell},{"cellText":nameCellText}, 
          {"name":response[x].periodicalName}, {"id":response[x].periodicalName}, {"checked":"true"}, 
          {"periodicalId":response[x].periodicalId}]);}(i)
      
      nameCellText.setAttribute("for", `${response[i].periodicalName}`)

      checkboxCell.appendChild(checkbox);
    }
    periodicalTable.checkboxes = checkboxes

    var authors = await getReq("/api/getTopicArticleAuthors")
    var authorTable = document.createElement("Table");
    let authorThead = authorTable.createTHead();

    var authorCheckboxes = []

    for (i = 0; i < authors.length; i++) {
      let row = authorThead.insertRow();
      row.classList.add("periodicalRow");
  
      let nameCell = row.insertCell();
      let nameCellText = makeNode("label", [{"innerText":`${authors[i].authorFullName}`}])
      nameCell.appendChild(nameCellText);
  
      let numberOfArticles = row.insertCell();
      let numberOfArticlesText = makeNode("label", [{"innerText":`${authors[i].numberOfArticles}`}])
      numberOfArticles.appendChild(numberOfArticlesText);
  
      let checkboxCell = row.insertCell();
  
      
      authorCheckboxes[i] = function(x){
          return checkbox = makeNode("input", [{"type":"checkbox"}, {"cell":checkboxCell},{"cellText":nameCellText}, 
          {"name":authors[x].authorFullName}, {"id":authors[x].authorFullName}, {"checked":"true"}, 
          {"authorId":authors[x].authorId}]);}(i)
  
      authorCheckboxes[i].addEventListener("click", function (x) {
            return function(){toggleFilters(checkboxes, authorCheckboxes[x], authorCheckboxes)};
          }(i));
  
      nameCellText.setAttribute("for", `${authors[i].authorFullName}`)
      
      checkboxCell.appendChild(checkbox);
    }
    authorTable.authorCheckboxes = authorCheckboxes

    for(i=0;i<checkboxes.length;i++){
      checkboxes[i].addEventListener("click", function (x) {
        return function(){toggleFilters(checkboxes, checkboxes[x], authorCheckboxes)};
      }(i));
    }

    var periodicalFilter = clearAllAndReturn("#periodicalFilter");
    var authorsTab = document.querySelector("#authorsTab")

    authorsTab.addEventListener("click", function(){
      switchToAuthorFilter(authorTable, periodicalTable)
    })

    if(periodicalFilter){periodicalFilter.appendChild(periodicalTable);}
    
}

function setLoadingBar(progress, message){                                                  // Changes the loading bar message/value, if the loading bar is on-screen. 
    if(isLoadingBar){
      document.querySelector("#loadingBar").value = `${progress}`
      document.querySelector("#loadingBar").textContent = `${progress}%`
      document.querySelector("#loadStatusText").textContent = `${message}`
    }
}

function makeTopicsTable(response) {                                                       // Makes the topics table and returns the checkboxes for the topics.       
    setLoadingBar(15, "Organizing articles...");                                           // Gets passed to getUserTopics(), or you can pass it to setUserBoxes
    var checkboxes = [];                                                                   // to update the topic table and stop there (such as the case with sendNewTopic())
    var topicsTable = makeNode("Table", [{"className":"table is-child"}])
    let thead = topicsTable.createTHead();
    for (i = 0; i < response.length; i++) {
        let row = thead.insertRow();
        row.classList.add("topicRow");

        let cell = row.insertCell();

        let cellText = makeNode("label", [{"innerText":response[i].name}])
        cell.appendChild(cellText);

        let checkboxCell = row.insertCell();
        let checkbox = makeNode("input", [{"id":response[i].name}, {"cell":checkboxCell}, {"cellText":cellText}, 
                                  {"topicId":response[i].topicId}, {"articleId":response[i].articleId}, {"name":response[i].name}, {"type":"checkbox"}])

        checkbox.addEventListener("click", function () {
            event.preventDefault();
            toggleUserTopic(checkbox);
        });

        cellText.setAttribute("for", `${response[i].name}`)

        checkboxes.push(checkbox);

        checkboxCell.appendChild(checkbox);
    }
    var myTopics = clearAllAndReturn("#myTopics");
    myTopics.appendChild(topicsTable);
    return checkboxes
}

function setUserBoxes(response, checkboxes) {
  for (i = 0; i < response.length; i++) {
    for (j = 0; j < checkboxes.length; j++) {
      if (checkboxes[j].topicId == response[i].topicId) {
        checkboxes[j].checked = true;
      }
    }
  }
}

function makeLoadingBar(initial, message){
    let articleList = clearAllAndReturn("#articleList")
    let loadStatusText = makeNode("p", [{"className":"subtitle"}, {"innerText":message}, {"id":"loadStatusText"}])
    let dummyText = makeDummyText()
    let loadingBarDiv = makeNode("div", [{"style":"padding: 60px;"}, {"className":"tile is-parent is-vertical box"}, {"id":"loadingBarDiv"}])
    let loadingBar = makeNode("progress", [{"id":"loadingBar"}, {"className":"progress title"}, {"value":initial}, {"textContent":initial}, {"max":"100"}])
    appendThese(loadingBarDiv, [loadingBar, loadStatusText, dummyText]);
    articleList.appendChild(loadingBarDiv)
    isLoadingBar = true;
}

function displayNoArticles() {
  let articleList = clearAllAndReturn("#articleList");
  isLoadingBar = false

  let articleDiv = makeNode("div", [{"className":"tile is-parent is-vertical box"}, {"style":"padding: 60px; text-align: center;"}])
  let articleDivPara = makeNode("p", [{"className":"title is-5"}, {"innerText":"We don't have any articles for you yet!"}])  
  let articleDivParaSub = makeNode("p", [{"className":"subtitle is-6"}, {"innerText":"Pick some topics to get started"}])

  let pencilIconCol = makeNode("p", [{"className":"columns is-centered"}])
  let pencilIcon = makeNode("icon", [{"id":"noteIcon"}, {"className":"icon column is-centered is-large"}, {"innerText":"📝"}])

  let dummyText = makeDummyText()     //Div will shrink unless it's filled, so filling with invisible text JIC

  pencilIconCol.appendChild(pencilIcon);
  appendThese(articleDivPara, [articleDivParaSub, pencilIconCol])
  appendThese(articleDiv, [articleDivPara, dummyText])
  articleList.appendChild(articleDiv);
}


function makeUserArticleHistorySidebar(response) {
  var ul = document.createElement("ul");
  if(response.length == 0){
      return;
  }
  for (var i = 0; i < response.length; i++) {
    let title = makeNode("span", [{"innerText":response[i].title}, {"className":"subtitle"}]);
    let linefeed = document.createElement("br");
    title.appendChild(linefeed);
    let content = makeNode("span", [{"className":"content sidebarBlurb"}, {"innerHTML":"<br/>"}])
    if(response[i].content != null){
      content.innerText = response[i].content.substr(0, 100) + " ... ";
      content.innerHTML += "<br/>"
    }
    let link = makeNode("a", [{"innerHTML":"<br/>Read Again <i class='fas fa-share'></i>"}, {"href":response[i].url}, {"target":"_blank"}])
    let lastViewed = document.createElement("span");
    let date = new Date(response[i].lastViewed);
    lastViewed.innerText = `Read: ${date} `;
    lastViewed.className = "last-viewed";
    let li = document.createElement("li");
    appendThese(li, [title, content, lastViewed, link])
    ul.appendChild(li);
  }

  var userArticleHistoryList = clearAllAndReturn("#recent-articles");
  isLoadingBar = false
  userArticleHistoryList.appendChild(ul);
}

function clearAllAndReturn(query){
    var node = document.querySelector(`${query}`);
    if(node && node.hasChildNodes()){
        for(i=0; i< node.children.length; i++){
            node.removeChild(node.children[i]);
        }
    }
    return node;
}

async function getTopicArticles() {
    makeLoadingBar(80, "Fetching articles...");
    var topicArticles = await getReq("/api/getTopicArticlesWithConcatTopics").catch(e=>{console.log(e)})
    setLoadingBar(90, "Almost there!")
    indexCount = 0;
    generateArticlesList(topicArticles, PAGE_SIZE)
    var sources = await getReq("/api/getTopicArticleSources").catch(e=>{console.log(e)})
    makeFilters(sources)
}

async function openArticle(id, url) {
  let jsonObj = {
    articleId: id,
  };
  var response = await postReq("/api/setUserReadArticle", jsonObj)
  window.open(url, "_blank");
}

function makeNode(elementType, properties){
    let element = document.createElement(elementType);
    for(m=0; m<properties.length; m++){
        for(let prop in properties[m]){
                element[prop] = properties[m][prop]
        }
    }
    return element
}

function show(page){                                        // Used for the "next page" and "previous page" buttons after 
  if(page.style.visibility == "hidden"){                    // generateArticlesList determines whether we have next/previous pages.
    page.style.visibility = "visible"
  }
}

function hide(page){
  if(page.style.visibility == "visible"){
    page.style.visibility = "hidden"
  }
}

function generateArticlesList(response, pageSize){          // Controls the flow into makeArticlesPage by sending select amounts of the response
  if(response.length == 0){                                 // to be created at a time. Also controls whether "next" and "previous" page controls
    hide(nextPage)                                          // are visible or not. Sets the event listeners for nextPage and prevPage.
    hide(prevPage)
    displayNoArticles()
  }
  if(indexCount == 0){
    hide(prevPage)
  }
  if(pageSize > response.length){
    makeArticlesPage(response, response.length, indexCount)
    indexCount += response.length
    hide(nextPage)
  }
  if(indexCount + pageSize <= response.length){
    makeArticlesPage(response, pageSize, indexCount)
    indexCount += pageSize;
    if(indexCount == response.length){
      hide(nextPage)
    }
  }
  else if(indexCount < response.length && indexCount + pageSize > response.length){
    let num = response.length % pageSize
    makeArticlesPage(response, num, indexCount)
    hide(nextPage)
    indexCount += num
  }
  nextPage.onclick = function(){
    isLoadingBar = false
    generateArticlesList(response, pageSize)                         // Recursive call because the required checks are the same.
    if(indexCount - pageSize >= 0){
      show(prevPage)
      prevPage.onclick = function(){
        isLoadingBar = false
        handlePrevPage(response, pageSize)
      }
    }
    else{
      hide(prevPage)
      return
    }
  }

  pageDiv = clearAllAndReturn('#pagination')
  pageDiv.style.textAlign = "center"
  pagNav.appendChild(prevPage)
  pagNav.appendChild(nextPage)
  pageDiv.appendChild(pagNav)
}

function handlePrevPage(response, pageSize){
  if(indexCount % pageSize == 0){                                     // 2 steps backward, 1 step forward to return the last page.
    indexCount -= pageSize * 2;
  }
  else{
    indexCount = indexCount - pageSize - (indexCount % pageSize)
  }
  makeArticlesPage(response, pageSize, indexCount)
  indexCount += pageSize;
  if(indexCount - pageSize <= 0){
    hide(prevPage)
    return
  }
  if(indexCount < response.length){
    show(nextPage)
  }
  else{
    hide(nextPage)
  }
}

function appendThese(node, childNodes){
  for(i=0;i<childNodes.length;i++){
    node.appendChild(childNodes[i])
  }
} 

async function makeArticlesPage(response, amount, startingIndex) {    // WARNING! This function is super fragile and prone to breakage!
  setLoadingBar(90, "Generating list...");                            // There is a very delicate balance at play keeping these variables
  
  var list = document.createElement("ul");                            // from being undefined. Most of it has to do with setting object properties
  if (response.length == 0) {                                         // equal to important identifying variables and in some cases setting their
    displayNoArticles();                                              // parent elements as a property, or storing elements that undergo async operations in arrays.                                                                      
  } else {                                                            // The alternating use of 'let' and 'var' here is intentional.
        let appender = []
        var nonUserTopicSpansArray = []                               // ALSO WARNING! Don't call this function on its own. Call generateArticlesList to make the list.
        for (i = startingIndex; i < startingIndex + amount; i++) {
            let listItem = document.createElement("li");
            let articleTitle = makeNode("p", [{"className":"article-title is-size-5 has-text-weight-bold has-text-dark"}, 
              {"innerText":response[i].title}])
            var topics = response[i].topic.split('&&&')
            var topicIds = response[i].topicId.split('&&&')
            var topic = makeNode("span", [{"className":"topic"}, {"id":`topicList${response[i].articleId}`}])
            var topicText = makeNode("span", [{"className":"is-small is-uppercase is-size-7 put-to-bottom"}, 
            {"textContent":"Topics "}])
            topic.appendChild(topicText)
            for(j=0;j<topics.length;j++){
              let topicSpan = makeNode("a", [{"className":"tag is-small is-dark is-uppercase is-size-7 topicButton"}, {"innerText":topics[j]}, 
                {"topicId":topicIds[j]}, 
                {"topic":topics[j]}])
              topicSpan.addEventListener("click", function(){
                openTopicPreview(topicSpan)
              })
              articleTitle.appendChild(topicSpan)
              topic.appendChild(topicSpan)
            }
            let articleContent = makeNode("p", [{"className":"article-content is-size-6 has-text-grey-dark"}, 
              {"innerText":response[i].content}])

            let periodical = makeNode("a", [{"innerText":response[i].periodicalName}, 
              {"href":response[i].periodicalUrl}, 
              {"target":"_blank"}, 
              {"className":"periodical is-size-6 has-text-dark"}])

            let author = makeNode("span", [{"className":"author is-size-6 has-text-dark"}])

            author.innerText = ` ${response[i].firstName} ${response[i].lastName}`;

            let articleDate = makeNode("span", [{"style":"font-family: 'EB Garamond', Georgia, Times, serif;"}, 
              {"className":"article-date is-size-6 has-text-dark"}])

            let articleDateText = document.createElement("span");
            articleDate.innerText = response[i].date.substring(0, 10);
            articleDateText.appendChild(articleDate);
            
            let readButton = makeNode("a", [{"style":"padding-right: 20px;"}, 
              {"url":response[i].url}, 
              {"articleId":response[i].articleId}, 
              {"innerHTML":"Read <i class='fas fa-share'></i><br/>"}])

            readButton.addEventListener("click", async function () {
                window.open(readButton.url, "__blank");
                toggleUserArticle(readButton);

                var userHistory = await getReq("/api/getUserArticlesHistory")
                makeUserArticleHistorySidebar(userHistory)
            });  

            // This lets the user click a "+" to add a new topic.
            let addTopicButton = makeNode("a", [{"className":"tag is-small is-light is-uppercase topicButton"},         
              {"innerHTML":"<i class='fas fa-plus'></i>"}, 
              {"articleId":response[i].articleId}, 
              {"topic":response[i].topic.split('&&&')},
              {"topicIds":response[i].topicIds},
              {"listItem":listItem}])

            addTopicButton.addEventListener("click", function(){
              showAddTopic(addTopicButton)
            })

            let spanForNonUserTopics = makeNode("span",                         // This is the light-colored tags that show next to the user's tags. 
                [{"articleId":response[i].articleId},       
                {"id":`nonUserSpan${response[i].articleId}`},                    
                {"topic":response[i].topic.split('&&&')},                       // Topics are returned as GROUP_CONCAT(Topics.name SEPARATOR '&&&') 
                {"className":"tag is-dark is-uppercase topicButton"},             //                  ['&&&' seemed like an unlikely enough three characters to use]
                {"textContent":""}])

            spanForNonUserTopics.style.display = "none"                         // Not displayed by default to avoid ugly empty space.

            nonUserTopicSpansArray.push(spanForNonUserTopics)                   // Whether or not to display them depends on AJAX call that messes up the scope,
                                                                                // so we wait until the loop is over and then iterate through this array separately.
            spanForNonUserTopics["listItem"] = listItem
           
            appender.push(function(a, b, c, d, e, f, g, h, i){                  // Very hideous means of appending the lot. It's pretty much exactly the closure activity
              return function(){                                                // from 290. We store the function that appends them and then execute it after the loop.
                appendThese(listItem, [a, b, c, d, e, f, g, h, i])}
            }(articleTitle, articleContent, periodical, author, articleDateText, readButton, topic, spanForNonUserTopics, addTopicButton));

            var listItemDiv = makeNode("div", [{"className":"tile is-parent is-vertical box"}, 
              {"id":"listItemDiv"}, 
              {"periodicalId":response[i].periodicalId}, 
              {"articleId":response[i].articleId}])

            
            listItemDiv.appendChild(listItem);
            list.appendChild(listItemDiv);
        }

        for(j=0; j<appender.length; j++){                                       // See one comment up.
          appender[j]()
        }

        getAllTopicsForSingleArticle(nonUserTopicSpansArray)                    // This gets *every* topic for the articles on the page.
                                                                                // (Uses a pretty expensive loop so doing it on a page-by-page basis.)
        let dummyText = makeDummyText()

        let icon = makeNode("icon", [{"innerText":"📰"},                        // Icon at the bottom of the article list to signify page end.
          {"className":"icon column is-centered is-large"}, 
          {"id":"noteIcon"}])

        let iconCol = makeNode("p", [{"className":"columns tile is-parent"}, 
          {"id":"iconCol"}])

        iconCol.appendChild(icon)

        appendThese(list, [iconCol, dummyText])

        var articleList = clearAllAndReturn("#articleList");
        articleList.appendChild(list);   
    }
}

async function openTopicPreview(button){

  var jsonObj = {}                                                        // We'll be sending the topic *name* to the server via POST.
  jsonObj["topic"] = button.topic

  var singleTopicList = await postReq('/api/getJustOneTopic', jsonObj)
  var relatedTopics = await postReq('/api/getRelatedTopics', jsonObj)

  var modalParent = makeNode("div", [{"className":"modal"}])                // This uses Bulma's modal popup. Looks like a lot of stuff but it's really not.

  var modalBg = makeNode("div", [{"className":"modal-background"}])         // Faded background

  var modalCard = makeNode("div", [{"className":"modal-card"}])             // Card body

  var modalHeader = makeNode("header", [{"className":"modal-card-head"}])   // Header

  var modalTitle = makeNode("p", [{"className":"modal-card-title"}, 
  {"textContent":button.topic}])

  var relTopicDiv = makeNode("div", [{"className":"relTopicsDiv"}])
  if(relatedTopics.length > 0){
    var relTopicTags = makeNode("div", [{"className":"tags"}, {"style":"padding-bottom: 1.5rem !important;"}])
    var relTopicTitle = makeNode("p", [{"className":"subtitle is-size-6"}, {"textContent":"Related Topics"}, {"style":"padding-right: 10px; margin-bottom: 0.5rem !important;"}])
    relTopicDiv.appendChild(relTopicTitle)
    for(i=0;i<relatedTopics.length;i++){
      let relTopicTag = makeNode("a", [{"className":"tag is-info is-uppercase"}, {"textContent":relatedTopics[i].topic}, {"topic":relatedTopics[i].topic}, {"topicId":relatedTopics[i].topicId}])
      relTopicTag.addEventListener("click", function(){
        document.body.removeChild(modalParent)
        openTopicPreview(relTopicTag)
      })
      relTopicTags.appendChild(relTopicTag)
    }
    relTopicDiv.appendChild(relTopicTags)
  }

  var exitModal = makeNode("button", [{"className":"delete"}, {"aria-label":"close"}])

  exitModal.addEventListener("click", function(){                         // There's a close button at the bottom and an 'X' at the top. Both just remove the whole thing.
    document.body.removeChild(modalParent)
  })

  var modalSection = makeNode("section", [{"className":"modal-card-body"}])

  var modalFooter = makeNode("footer", [{"className":"modal-card-foot"}])

  var modalFooterButtonText = ""                                          
  var modalFooterButtonClass = ""                                         

  if(button.classList.contains("is-dark") || button.classList.contains("is-success")){        // Since /api/toggleTopic doesn't care about the state, we can just look at the color of the button
    modalFooterButtonText = "Remove from My Topics";                                          // to determine whether it's one of the user's topics.
    modalFooterButtonClass = "button is-danger";                          
  } else{
    modalFooterButtonText = "Add to My Topics";
    modalFooterButtonClass = "button is-success";
  }

  var modalFooterButtonClose = makeNode("button", [{"className":"button is-light"}, {"textContent":"Close"}])

  modalFooterButtonClose.addEventListener("click", function(){
    document.body.removeChild(modalParent)
  })

  let articleTable = makeNode("table", [{"className":"table"}])

  for(i=0;i<singleTopicList.length;i++){                                                        // Table of articles for the topic preview.
    let articleRow = articleTable.insertRow()

    let titleCell = articleRow.insertCell()

    let titleCellText = makeNode("span", [{"textContent":singleTopicList[i].title}, 
      {"className":"title is-6"}])

    titleCell.appendChild(titleCellText)

    let readCell = articleRow.insertCell()

    let readCellLink = makeNode("a", [{"articleId":singleTopicList[i].articleId}, 
      {"url":singleTopicList[i].url}])

    let readCellText = makeNode("i", [{"className":"far fa-newspaper"}])

    readCellLink.appendChild(readCellText)

    readCellLink.addEventListener("click", function(){
      window.open(readCellLink.url, "__blank");
      toggleUserArticle(readCellLink)
    })

    readCell.appendChild(readCellLink)

    let periodicalCell = articleRow.insertCell()

    let periodicalCellText = makeNode("span", [{"textContent":singleTopicList[i].periodicalName}])

    periodicalCell.appendChild(periodicalCellText)
  }
  modalSection.appendChild(relTopicDiv)
  modalSection.appendChild(articleTable)
  var modalFooterButton = makeNode("button", [{"className":modalFooterButtonClass}, 
    {"innerText":modalFooterButtonText}, 
    {"topic":button.topic}])

  modalFooterButton.addEventListener("click", function(){
    var jsonObj = {}
    jsonObj["topic"] = button.topic
    var checkbox = document.getElementById(button.topic)
    toggleUserTopic(checkbox)
    document.body.removeChild(modalParent)
  })

  appendThese(modalHeader, [modalTitle, exitModal])
  appendThese(modalFooter, [modalFooterButton, modalFooterButtonClose])
  appendThese(modalCard, [modalHeader, modalSection, modalFooter])
  appendThese(modalParent, [modalBg, modalCard])

  modalParent.classList.add("is-active")
  document.body.appendChild(modalParent)
}

async function getAllTopicsForSingleArticle(buttons){
  articleIds = []
  topics = []

  for(i=0;i<buttons.length;i++){
    articleIds.push(buttons[i].articleId)             
    for(j=0;j<buttons[i].topic.length;j++){
      topics.push(buttons[i].topic[j])
    }
  }

  jsonObj = {}
  jsonObj["topics"] = topics
  jsonObj["articleIds"] = articleIds

  var response = await postReq("/api/allTopicsForArticles", jsonObj)

  if(response.length === 0){

    var extraTopics = makeNode("span", [{"className":"extraTopics"}, {"textContent":""}])

  } else{
    for(i=0;i<response.length;i++){
      for(j=0;j<buttons.length;j++){                                              // This is why I did it page-by-page lol
        if(buttons[j].articleId == response[i].articleId){
          let splitTopics = response[i].topics.split('&&&')
          let extraTopics = makeNode("span", [{"className":"topic"}, {"id":"#extraTopics"}])

          for(k=0;k<splitTopics.length;k++){
            let extraTopic = makeNode("a", [{"className":"tag is-light is-uppercase topicButton"},
            {"textContent":splitTopics[k]}, 
            {"articleId":buttons[j].articleId}, 
            {"topic":splitTopics[k]},
            {"listItem":buttons[j].listItem}])

            extraTopics.appendChild(extraTopic)

            extraTopic.addEventListener("click", function(){
              openTopicPreview(extraTopic)
            })
          }
          buttons[j].style.display = ""

          buttons[j].listItem.replaceChild(extraTopics, buttons[j])
        }
      }
    }
    
  }
}

async function showAddTopic(button){                                        // User can add a new topic or select an existing one that
  var textInputDiv= makeNode("div", [{"class":"field"}])                    // also describes the article.

  var textInputLabel = makeNode("label", [{"class":"label"},                // Uses two radio buttons ("Add new" and "Select Existing")
    {"textContent":"Why don't you tell me the topic?"}])                    // and switches between a text input for "Add new" 
                                                                            // and a dropdown for "Select Existing"
  var textInputControl = makeNode("div", [{"class":"control"}])

  var textInput = makeNode("input", {"type":"text"}, [{"className":"input"}])

  textInput.setAttribute("placeholder","Topic name")

  var selectExistingDiv = makeNode("div", [{"className":"select is-multiple"}, 
    {"id":"selectExisting"}])

  var selectExistingControl = makeNode("select", [{"multiple size":"6"}])

  var topics = await getReq("/api/getTopics")                               // Grabs the list of topics for the dropdown menu

  var noneOption = document.createElement("option")

  noneOption.value = null

  noneOption.textContent = "Select existing"

  selectExistingControl.appendChild(noneOption)

  for(i=0; i<topics.length;i++){
    var topicOption = document.createElement("option")
    topicOption.value = topics[i].name
    topicOption.innerText = topics[i].name
    selectExistingControl.appendChild(topicOption)
  }

  selectExistingDiv.appendChild(selectExistingControl)

  var textHelper = makeNode("p", [{"className":"help"}, 
    {"textContent":"Since you're so smart all of a sudden..."}])

  var radioControl = makeNode("div", [{"className":"control"}])

  var addLabel = makeNode("label", [{"className":"radio addOrEdit"}, 
    {"name":"addOrEdit"}, 
    {"textContent":"Write your own  "}])

  var selectLabel = makeNode("label", [{"className":"radio addOrEdit"}, 
    {"name":"addOrEdit"}, 
    {"textContent":"Select existing  "}])

  var addRadio = makeNode("input", [{"type":"radio"}, 
    {"name":"addOrSelect"}, 
    {"value":"add"}])

  addRadio.checked = true;

  var selectRadio = makeNode("input", [{"type":"radio"}, 
    {"name":"addOrSelect"}, 
    {"value":"select"}])

  addLabel.appendChild(addRadio)
  selectLabel.appendChild(selectRadio)

  selectRadio.addEventListener("click", function(){
    textInputDiv.replaceChild(selectExistingDiv, textInput)
    addRadio.addEventListener("click", function(){
      textInputDiv.replaceChild(textInput, selectExistingDiv)
    })
  })

  radioControl.appendChild(addLabel)
  radioControl.appendChild(selectLabel)

  var textSubmit = makeNode("button", [{"className":"button is-dark is-small"}, {"textContent":"Add"}])
  var textCancel = makeNode("button", [{"className":"button is-light is-small"}, {"textContent":"Cancel"}])

  textCancel.addEventListener("click", function(){
    button.listItem.replaceChild(button, textInputDiv)
  })
  textSubmit.addEventListener("click", function(){
    textSubmit.textContent = "Thanks!"
    textSubmit.className = "button is-success"
    if(selectRadio.checked == true){
      var topic = selectExistingControl.value
    }
    else{
      var topic = textInput.value
    }
    sendNewTopic(topic, button)
    button.listItem.replaceChild(button, textInputDiv)
  })

  appendThese(textInputDiv, [textInputLabel, textInputControl, textHelper, textInput, radioControl, textSubmit, textCancel])
  button.listItem.replaceChild(textInputDiv, button)
}

async function sendNewTopic(topic, button){
  let jsonObj = {
    "newTopic":topic,
    "articleId":button.articleId,
    "topic":button.topic
  }
  console.log(button)
  
  var response = await postReq("/api/addTopic", jsonObj)
  let jsonObj2 = {
    "articleId":button.articleId
  }
  var newTopicList = await postReq("/api/topicsForSingleArticle", jsonObj)
  var userTopics = await getReq("/api/getUserTopics")
  var topicList = document.querySelector(`#topicList${jsonObj2["articleId"]}`)
  console.log(topicList)
  var isAlreadyThere = false
  for(i=1;i<topicList.children.length;i++){
    if(topicList.children[i].textContent == topic){
      topicList.children[i].classList.remove("is-dark")
      topicList.children[i].classList.add("is-success")
      isAlreadyThere = true
    }
  }
  for(i=0;i<newTopicList.length;i++){
    if(newTopicList[i].topic == topic){
      topic.topicId = newTopicList[i].topicId
      break
    }
  }
  if(!isAlreadyThere){
    let newTopic = makeNode("a", [{"className":"tag is-success is-uppercase topicButton"}, {"topicId":topic.topicId}, {"textContent":topic}, {"topic":topic}])
    newTopic.addEventListener("click", function(){
      openTopicPreview(newTopic)
    })
    topicList.insertBefore(newTopic, topicList.children[1])
  }
  var topics = await getReq("/api/getTopics")
  var userTopics = await getReq("/api/getUserTopics")
  isLoadingBar = false;
  var checkboxes = makeTopicsTable(topics)
  setUserBoxes(userTopics, checkboxes)
}

function makeDummyText(){                               // Invisible text to prevent the article list from shrinking 
    let dummyText = document.createElement('div')       //    when all the articles are gone. 
    for(i=0;i<65;i++){
      dummyText.textContent += "x"
    }
    dummyText.className = "title";
    dummyText.style.visibility = "hidden"
    return dummyText
}

function bindResetButton(){
  var reset = document.querySelector("#resetButton")
  reset.addEventListener("click", function(){
    getTopicArticles()
    var authorsTab = document.querySelector("#authorsTab")
    var sourcesTab = document.querySelector("#sourcesTab")
    if(authorsTab.classList.contains("is-active")){
      authorsTab.classList.remove("is-active")
      sourcesTab.classList.add("is-active")
    }
  })
}

async function openArticlePreview(e, term, item){
  var jsonObj = {}                                                        // We'll be sending the topic *name* to the server via POST.
  jsonObj["title"] = item.dataset.val
  
  var singleArticle = await postReq('/api/getJustOneArticle', jsonObj)

  var response = singleArticle[0]

  var modalParent = makeNode("div", [{"className":"modal"}])                // This uses Bulma's modal popup. Looks like a lot of stuff but it's really not.

  var modalBg = makeNode("div", [{"className":"modal-background"}])       // Faded background

  var modalCard = makeNode("div", [{"className":"modal-card"}])           // Card body

  var modalHeader = makeNode("header", [{"className":"modal-card-head"}]) // Header

  var titleString = "View Article"

  var modalTitle = makeNode("p", [{"className":"modal-card-title"}, 
  {"textContent":titleString}])

  var exitModal = makeNode("button", [{"className":"delete"}, {"aria-label":"close"}])

  exitModal.addEventListener("click", function(){                         // There's a close button at the bottom and an 'X' at the top. Both just remove the whole thing.
    document.body.removeChild(modalParent)
  })

  var modalSection = makeNode("section", [{"className":"modal-card-body"}])

  var modalFooter = makeNode("footer", [{"className":"modal-card-foot"}])

  var modalFooterButtonClose = makeNode("button", [{"className":"button is-light"}, {"textContent":"Close"}])

  modalFooterButtonClose.addEventListener("click", function(){
    document.body.removeChild(modalParent)
  })
  var articleDiv = makeNode("div", [{"className":"singleArticleDiv"}])
  var articleTitle = makeNode("p", [{"className":"title"}, {"textContent":response.title}])
  var articleContent = makeNode("p", [{"className":"articleContent"}])
  articleContent.style.paddingBottom = "10px"
  if(response.content != null){
    articleContent["textContent"] += response.content
  }

  var readButton = makeNode("a", [{"style":"padding-right: 20px;"}, 
              {"url":response.url}, 
              {"articleId":response.articleId}, 
              {"innerHTML":"Read <i class='fas fa-share'></i><br/>"}])

  readButton.addEventListener("click", async function () {
      window.open(readButton.url, "__blank");
      toggleUserArticle(readButton);

      var userHistory = await getReq("/api/getUserArticlesHistory")
      makeUserArticleHistorySidebar(userHistory)
  });  

  var periodical = makeNode("span", [{"className":"subtitle is-6"}, {"textContent":response.periodicalName}])
  var author = makeNode("span", [{"className":"subtitle is-6"}, {"textContent":`${response.firstName} ${response.lastName}`}, {"style":"font-weight: bold;"}])
  author.innerHTML += "&nbsp;|&nbsp;"
  periodical.innerHTML += "&nbsp;|&nbsp;"
  appendThese(articleDiv, [articleTitle, articleContent, author, periodical, readButton])
  modalSection.appendChild(articleDiv)
  appendThese(modalHeader, [modalTitle, exitModal])
  appendThese(modalFooter, [modalFooterButtonClose])
  appendThese(modalCard, [modalHeader, modalSection, modalFooter])
  appendThese(modalParent, [modalBg, modalCard])

  modalParent.classList.add("is-active")
  document.body.appendChild(modalParent)

}

var xhr;
new autoComplete({
    selector: '#searchBox',
    source: function(term, response){
        try { xhr.abort(); } catch(e){}
        xhr = $.getJSON('/api/searchTitles', { q: term }, function(data){ 
          response(data); 
        });
    },
    onSelect: function(e, term, item){
      console.log(item)
      openArticlePreview(e, term, item)
    },
    minChars: 1

});

//The island of unhappy code

//let date = new Date(response[i].date)
//let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)    // Date is not finite. I think it's a database issue.
//let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
//let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date)
//articleDate.innerText = `${month} ${day} ${year} `;

/* let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date) // Same thing here.
let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date) */
//let date = response[i].lastViewed.substr(0, 10)





