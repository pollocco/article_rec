async function getReq(url=''){
    const response = await fetch(url)
    return response.json()
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

async function getUserTopics(checkboxes) {
    var response = await getReq('/api/getUserTopics')
    setUserBoxes(response, checkboxes)
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

async function toggleUserTopic(checkbox, checkboxes) {
    var loader = makeNode("progress", [{"id":"checkboxLoader"}, {"max":"100"}, 
      {"className":"progress is-small is-dark"}, {"textContent":"30%"}])
    checkbox.cell.replaceChild(loader, checkbox)
    let jsonObj = {
      topicId: checkbox.topicId,
    };
    var response = await postReq("/api/toggleTopic", jsonObj)
    checkbox.cell.replaceChild(checkbox, loader)
    checkbox.checked = !checkbox.checked
    setUserBoxes(response, checkboxes)
    return;
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

function makeTable(response) {
    var checkboxes = [];
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
            toggleUserTopic(checkbox, checkboxes);
        });

        cellText.setAttribute("for", `${response[i].name}`)

        checkboxes.push(checkbox);

        checkboxCell.appendChild(checkbox);
    }
    var myTopics = document.querySelector("#myTopics");
    myTopics.appendChild(topicsTable);
    getUserTopics(checkboxes);
}


function makeUserArticleHistory(response){
    var ul = document.createElement("ul");
    for(var i=0; i < response.length; i++){

        let topic = document.createElement("span");
        topic.innerText = response[i].topic;
        topic.className = "is-size-7 is-uppercase is-block";

        let title = document.createElement("span");
        title.innerText = response[i].title;
        title.className = "subtitle";
        if(response[i].hasOwnProperty("content") && response[i].content != null){
            let content = document.createElement("span");
            content.innerText = response[i].content.substr(0,100) + " ... ";
            content.className = "content";
        }
        
        let link = document.createElement("a");
        link.innerHTML = 'Read Again <i class="fas fa-share"></i>';
        link.href = response[i].url;
        link.target = '_blank';
        link.className = "is-size-6 is-italic";

        let lastViewed = document.createElement("span");
        let date = new Date(response[i].lastViewed)

        let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date)
        let month = new Intl.DateTimeFormat('en', { month: 'short' }).format(date)
        let day = new Intl.DateTimeFormat('en', { day: 'numeric' }).format(date)

        lastViewed.innerText = `Read on ${month} ${day} ${year} `;
        lastViewed.className = "is-size-6 is-italic last-viewed has-text-dark";

        let li =  document.createElement("li");
        li.appendChild(topic);
        li.appendChild(title);
        // li.appendChild(content);
        li.appendChild(lastViewed);
        li.appendChild(link);

        ul.appendChild(li);
    }
    var userArticleHistoryList = document.querySelector('#userArticleHistoryList');
    userArticleHistoryList.appendChild(ul);
    // getUserTopics(checkboxes);
}

function makeNoHistory(){
    let noHistory = document.createElement("span");
    noHistory.innerHTML = 'You have no history of read articles. You should read more. <a href="/">Go to articles</a>';
    noHistory.className = "is-size-6 has-text-dark";

    var userArticleHistoryList = document.querySelector('#userArticleHistoryList');
    userArticleHistoryList.appendChild(noHistory);
}

function getUserArticlesHistory(){
    var req = new XMLHttpRequest();
    req.open("GET", "/api/getUserArticlesHistory");
    req.addEventListener('load', function(){
        if(req.status >= 200 && req.status < 400){
            var response = JSON.parse(req.responseText);
            if(response.length > 0){
                console.log(response)
                makeUserArticleHistory(response);
            }
            else{
                makeNoHistory();
            }
        }
        else{
            console.log("Error! " + req.statusText);
        }
    })
    req.send();
}

document.addEventListener("DOMContentLoaded", async function(){
    var topics = await getReq("/api/getTopics")
    makeTable(topics)
    getUserArticlesHistory()
  })


