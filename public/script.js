function getTopics(){
    var req = new XMLHttpRequest();
    req.open("GET", "/api/getTopics", true);
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            console.log(response);
            makeTable(response);
        }
        else{
            console.log("Error! " + req.statusText);
        }
    })
    req.send();
}



function makeTable(response){
    var checkboxes = [];
    var topicsTable = document.createElement("Table");
    let thead = topicsTable.createTHead();
    for(i=0; i<response.length; i++){
        let row = thead.insertRow();
        row.classList.add('topicRow')

        let cell = row.insertCell();
        let cellText = document.createElement("label");
        cellText.innerText = `${response[i].name}`
        cell.appendChild(cellText);

        let checkboxCell = row.insertCell();

        let checkbox = document.createElement("input");
        checkbox.cellText = cellText;
        checkbox.name = `${response[i].name}`
        checkbox.topicId = `${response[i].topicId}`;
        checkbox.setAttribute("type", "checkbox");

        checkbox.addEventListener("click", function(){
            event.preventDefault();
            toggleUserTopic(checkbox)
        })

        checkbox.setAttribute("name", `${response[i].name}`)
        checkbox.setAttribute("id", `${response[i].name}`)
        cellText.setAttribute("for", `${response[i].name}`)

        checkboxes.push(checkbox)

        checkboxCell.appendChild(checkbox);
    }
    topicsTable.className = "table is-child"
    var myTopics = document.querySelector('#myTopics');
    myTopics.appendChild(topicsTable);
    getUserTopics(checkboxes);
}

function getUserTopics(checkboxes){
    console.log("hi")
    var req = new XMLHttpRequest();
    req.open("GET", "/api/getUserTopics", true);
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            if(response.length > 0){
                console.log(response);
                setUserBoxes(response, checkboxes);
                getTopicArticles(response);
            }
            else{
                displayNoArticles();
            }
        }
        else{
            console.log("Error! " + req.statusText);
        }
    })
    req.send();
}

function setUserBoxes(response, checkboxes){
    for(i=0; i<response.length; i++){
        for(j=0; j<checkboxes.length; j++){
            if(checkboxes[j].topicId == response[i].topicId){
                checkboxes[j].checked = true;
            }
        }
    }
}

function displayNoArticles(){
    let articleList = document.querySelector('#articleList')
    if(articleList.hasChildNodes()){
        for(i=0; i<articleList.children.length;i++){
            articleList.removeChild(articleList.children[i])
        }
    }
    let articleDiv = document.createElement('div')
    articleDiv.className = "tile is-parent is-vertical box"
    articleDiv.style.textAlign = "center";
    articleDiv.style.padding = "60px"

    let articleDivPara = document.createElement('p')
    articleDivPara.className = "title is-5"
    articleDivPara.innerText = "We don't have any articles for you yet!"

    let articleDivParaSub = document.createElement('p')
    articleDivParaSub.className = "subtitle is-6"
    articleDivParaSub.innerText = "Pick some topics to get started"

    let pencilIconCol = document.createElement('p')
    pencilIconCol.className = "columns is-centered"

    let pencilIcon = document.createElement('icon')
    pencilIcon.id = "noteIcon"
    pencilIcon.className = "subtitle is-6"
    pencilIcon.innerText = "📝"
    pencilIcon.className = "icon column is-centered is-large"

    pencilIconCol.appendChild(pencilIcon)

    articleDivPara.appendChild(articleDivParaSub)
    articleDivPara.appendChild(pencilIconCol)
    articleDiv.appendChild(articleDivPara)

    articleList.appendChild(articleDiv);
}

function toggleUserTopic(checkbox){
    var req = new XMLHttpRequest();
    req.open("POST", '/api/toggleTopic', true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            console.log(response)
            checkbox.checked = !(checkbox.checked)
            if(response.length > 0){
                getTopicArticles(response)
            }
            else{
                displayNoArticles();
            }
        }
        else{
            console.log("Error! " + req.statusText);
        }
    })
    let jsonObj = {
        "topicId": checkbox.topicId
    }
    req.send(JSON.stringify(jsonObj));
    return;
}

function toggleUserArticle(likeButton){
    var req = new XMLHttpRequest();
    req.open("POST", '/api/toggleUserArticle', true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            console.log(response)
            if(response.length > 0){
                getUserArticlesHistorySidebar();
            }
        }
        else{
            console.log("Error! " + req.statusText);
        }
    })
    let jsonObj = {
        "articleId": likeButton.articleId
    }
    req.send(JSON.stringify(jsonObj));
    return;
}


function getUserArticlesHistorySidebar(){
    var req = new XMLHttpRequest();
    req.open("GET", "/api/getUserArticlesHistory");
    req.setRequestHeader('Content-Type', 'application/json');
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            console.log('wat', response);

            if(response.length > 0){
                makeUserArticleHistorySidebar(response);
            }
            else{
                // displayNoArticles();
            }
        }
        else{
            console.log("Error! " + req.statusText);
        }
    })
    req.send();
}


function makeUserArticleHistorySidebar(response){
    var ul = document.createElement("ul");
    console.log('asdf', response.length)
    for(var i=0; i < response.length; i++){

        let title = document.createElement("span");
        title.innerText = response[i].title
        let linefeed = document.createElement("br")
        title.appendChild(linefeed)
        title.className = "subtitle";

        let content = document.createElement("span");
        content.innerText = response[i].content.substr(0,100) + " ... ";
        content.className = "content sidebarBlurb";
        content.innerHTML += "<br/>"

        let link = document.createElement("a");
        link.innerHTML = '<br/>Read Again <i class="fas fa-share"></i>';
        link.href = response[i].url;
        link.target = '_blank';

        let lastViewed = document.createElement("span");

        // "date value is not finite in DateTimeFormat.format()"
        //
        //let date = new Date(response[i].lastViewed)
        // 
        /* let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
        let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
        let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date) */

        let date = response[i].lastViewed.substr(0, 10)

        lastViewed.innerText = `Read: ${date} `;
        lastViewed.className = "last-viewed";

        let li =  document.createElement("li");
        li.appendChild(title);
        li.appendChild(content);
        li.appendChild(lastViewed);
        li.appendChild(link);

        ul.appendChild(li);
    }
    var userArticleHistoryList = document.querySelector('#recent-articles');
    if(userArticleHistoryList && userArticleHistoryList.hasChildNodes()){
        for(i=0; i<userArticleHistoryList.children.length;i++){
            userArticleHistoryList.removeChild(userArticleHistoryList.children[i])
        }
    }
    userArticleHistoryList.appendChild(ul);
    // getUserTopics(checkboxes);
}

function getTopicArticles(response){
    var req = new XMLHttpRequest();
    req.open("POST", '/api/getTopicArticles', true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            console.log(req.responseText)
            var response = JSON.parse(req.responseText);
            console.log(response)
            makeTopicArticles(response);
        }
        else{
            console.log("Error! " + req.statusText)
        }
    })
    let jsonObj = {
        "userId": response[0].userId
    }
    req.send(JSON.stringify(jsonObj));
}

function openArticle(id, url) {
    var req = new XMLHttpRequest();
    req.open("POST", '/api/setUserReadArticle', true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            console.log(response);
        }
        else{
            console.log("Error! " + req.statusText)
        }
    })
    let jsonObj = {
        "articleId": id
    }
    req.send(JSON.stringify(jsonObj));
    window.open(url, '_blank');
}


function makeTopicArticles(response){
    var list = document.createElement("ul");
    if(response.length == 0){
        displayNoArticles();
    }
    else{
        for(i=0; i<response.length; i++){
            let listItem = document.createElement('li');

            let topic = document.createElement("span");
            topic.innerText = response[i].topic;
            topic.className = "is-size-7 is-uppercase is-block";
            listItem.appendChild(topic);

            let articleTitle = document.createElement('p')
            articleTitle.className = "article-title is-size-5 has-text-weight-bold has-text-dark"
            articleTitle.innerText = response[i].title
            listItem.appendChild(articleTitle)

            let articleContent = document.createElement('p');
            articleContent.className = "article-content is-size-6 has-text-grey-dark"
            articleContent.innerText = response[i].content;
            listItem.appendChild(articleContent)

            let periodical = document.createElement("a");
            periodical.innerText = response[i].periodicalName;
            periodical.href = response[i].periodicalUrl;
            periodical.target = '_blank';
            periodical.className = "periodical is-size-6 has-text-dark";
            listItem.appendChild(periodical);

            let author = document.createElement("span");
            author.innerText = ` ${response[i].firstName} ${response[i].lastName}`;
            author.className = "author is-size-6 has-text-dark";
            listItem.appendChild(author);

            let articleDate = document.createElement('span');
            articleDate.style.fontFamily = "'EB Garamond', Georgia, Times, serif";
            articleDate.className ="article-date is-size-6 has-text-dark";
            let articleDateText = document.createElement('span');
            //let date = new Date(response[i].date)

            //let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
            //let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
            //let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date)

            //articleDate.innerText = `${month} ${day} ${year} `;
            articleDate.innerText = response[i].date.substring(0, 10)
            articleDateText.appendChild(articleDate)
            listItem.appendChild(articleDateText);


            let readButton = document.createElement('a');
            readButton.style.paddingRight = "20px"
            readButton.url = response[i].url
            readButton.articleId = response[i].articleId
            readButton.addEventListener('click', function(){
                window.open(readButton.url, '__blank')
                toggleUserArticle(readButton)
            })
            readButton.innerHTML = 'Read <i class="fas fa-share"></i>';
            listItem.appendChild(readButton);

            let listItemDiv = document.createElement("div");
            listItemDiv.className = "tile is-parent is-vertical box"
            listItemDiv.id = "listItemDiv"
            listItemDiv.appendChild(listItem)
            list.appendChild(listItemDiv)
        }
        var articleList = document.querySelector('#articleList')
        if(articleList && articleList.hasChildNodes()){
            for(i=0; i<articleList.children.length;i++){
                articleList.removeChild(articleList.children[i])
            }
            articleList.appendChild(list);
        }
    }
}


getTopics();
getUserArticlesHistorySidebar();
