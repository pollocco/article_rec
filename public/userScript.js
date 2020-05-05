
function makeUserArticleHistory(response){
    var ul = document.createElement("ul");
    for(var i=0; i < response.length; i++){

        let topic = document.createElement("span");
        topic.innerText = response[i].topic;
        topic.className = "is-size-7 is-uppercase is-block";

        let title = document.createElement("span");
        title.innerText = response[i].title;
        title.className = "subtitle";

        let content = document.createElement("span");
        content.innerText = response[i].content.substr(0,100) + " ... ";
        content.className = "content";

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


getUserArticlesHistory();
