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
            //checkbox.cellText.innerHTML = `<progress class="progress is-small is-primary" max="100">15%</progress>`
            toggleUserTopic(checkbox)
        })
        checkbox.setAttribute("name", `${response[i].name}`)
        checkbox.setAttribute("id", `${response[i].name}`)
        cellText.setAttribute("for", `${response[i].name}`)
        checkboxes.push(checkbox)
        checkboxCell.appendChild(checkbox);
    }
    topicsTable.className = "table tile is-child"
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
    articleDiv.innerHTML = `<p class='title is-5'>We don't have any articles for you yet!</p><p class='subtitle is-6'>Pick some topics to get started.</p><p class="columns is-centered><icon class="icon column is-centered is-large" id="noteIcon">📝</icon></p>`
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
            //checkbox.cellText.innerHTML = `<label for="${checkbox.name} class="label">${checkbox.name}</label>`
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

function makeTopicArticles(response){
    var list = document.createElement("ul");
    if(response.length == 0){
        displayNoArticles();
    }
    else{
        for(i=0; i<response.length; i++){
            let listItem = document.createElement('li');
            listItem.innerHTML = `<p class='title is-5'>${response[i].title}<p><em class="subtitle is-6" font-family: 'EB Garamond', Georgia, Times, serif;">${response[i].date.substring(0, 10)}</em></p></p>` 
            if(response[i].hasOwnProperty('imageUrl') && response[i].imageUrl != null){
                listItem.innerHTML += `<div class="card" style="width:300; height:200;"><div class="card-image"><figure class="image" style="width:300; height:200;"><img src='${response[i].imageUrl}'</figure></div></div>`
            }
            splitContent = response[i].content.split("\n\n")
            for(j=0; j<splitContent.length; j++){
                if(j == 0){
                    listItem.innerHTML +=  `<p class='subtitle articleContent' style="font-weight: bold; font-family: 'EB Garamond'; font-size: 1.5rem">${splitContent[j]}</p>`
                }
                else if((j == 8 || j == 24 || j == 40 || j == 56) && splitContent.length - j > 4){
                    if(splitContent[j].length < 150){
                        while(splitContent[j].length < 150 && splitContent.length - j > 4){
                            listItem.innerHTML += `<p class='subtitle is-6 articleContent'>${splitContent[j]}</p>`
                            j++
                        }
                        if(splitContent.length - j > 4){
                            listItem.innerHTML += `<div class="box" style="background-color: rgb(219, 232, 255);width: 50%; float: left; margin-right: 5%;"><p class='subtitle articleContent' style="font-weight: bold; font-style=italic; font-family: 'EB Garamond'; font-size: 1rem;">${splitContent[j]}</p>`
                        }
                        else{
                            `<p class='subtitle is-6 articleContent'>${splitContent[j]}</p>`
                        }
                    }
                    else{
                        listItem.innerHTML += `<div class="box" style="background-color: rgb(219, 232, 255);width: 50%; float: left; margin-right: 5%;"><p class='subtitle articleContent' style="font-weight: bold; font-style=italic; font-family: 'EB Garamond'; font-size: 1rem;">${splitContent[j]}</p>`
                    }
                }
                else if((j == 16 || j == 32 || j == 48 || j == 64) && splitContent.length - j > 4){
                    if(splitContent[j].length < 150){
                        while(splitContent[j].length < 150 && splitContent.length - j > 4){
                            listItem.innerHTML += `<p class='subtitle is-6 articleContent'>${splitContent[j]}</p>`
                            j++
                        }
                        if(splitContent.length - j > 4){
                            listItem.innerHTML += `<div class="box" style="background-color: rgba(246, 255, 231, 0.884); width: 50%; float: right; margin-left: 5%;"><p class='subtitle articleContent' style="font-weight: bold; font-style=italic; font-family: 'EB Garamond'; font-size: 1rem;">${splitContent[j]}</p>`
                        }
                        else{
                            `<p class='subtitle is-6 articleContent'>${splitContent[j]}</p>`
                        }
                    }
                    else{
                        listItem.innerHTML += `<div class="box" style="background-color: rgba(246, 255, 231, 0.884); width: 50%; float: right; margin-left: 5%;"><p class='subtitle articleContent' style="font-weight: bold; font-style=italic; font-family: 'EB Garamond'; font-size: 1rem;">${splitContent[j]}</p>`
                    }
                }
                else{
                    listItem.innerHTML += `<p class='subtitle is-6 articleContent'>${splitContent[j]}</p>`
                }
            }
            listItem.innerHTML += `<a href="${response[i].url}" style="padding-right: 20px;"><strong><u>Read</u></strong></a>`
            listItem.innerHTML += `<button class="button is-small"><span class="icon is-small"><i class="far fa-thumbs-up"></i></span><span>Like</span></button>`
            let listItemDiv = document.createElement("div");
            listItemDiv.className = "tile is-parent is-vertical box"
            listItemDiv.id = "listItemDiv"
            listItemDiv.appendChild(listItem)
            list.appendChild(listItemDiv)
        }
        var articleList = document.querySelector('#articleList')
        if(articleList.hasChildNodes()){
            for(i=0; i<articleList.children.length;i++){
                articleList.removeChild(articleList.children[i])
            }
        }
        articleList.appendChild(list)
    }
}

getTopics();
