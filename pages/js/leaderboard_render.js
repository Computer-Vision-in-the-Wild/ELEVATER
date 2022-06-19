function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    var fileContent = null;
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
                fileContent = allText;
            }
        }
    }
    rawFile.send(null);
    return fileContent;
}

var data_path = "./data/leaderboard_score.jsonl" // "./data/local_data.jsonl", "./data/leaderboard_score.jsonl" 
const retrieval_tasks = new Set(["tvr", "how2r", "yc2r", "vatex_en_r"]);
const qa_tasks = new Set(["tvqa", "how2qa", "violin", "vlep"]);
const caption_tasks = new Set(["tvc", "yc2c", "vatex_en_c"]);
const all_tasks = new Set([...retrieval_tasks, ...qa_tasks, ...caption_tasks]);

function compute_rank(scores){
    var sorted = scores.slice().sort(function(a,b){return b-a});
    var ranks = scores.map(function(v){ return sorted.indexOf(v)+1 });
    return ranks;
}

function compute_rank_break_tie(scores1, scores2){
    var temp_list = [];
    scores1.forEach((s1, i) => {
        let temp = {};
        temp["s1"] = s1.toFixed(2);
        temp["s2"] = scores2[i].toFixed(2);
        temp_list.push(temp);
    });
    var sorted = temp_list.slice().sort(function(a,b){
        var aSize = a["s1"];
        var bSize = b["s1"];
        var aLow = a["s2"];
        var bLow = b["s2"];

        if(aSize == bSize)
        {
            return (aLow < bLow) ? 1 : (aLow > bLow) ? -1 : 0;
        }
        else
        {
            return (aSize < bSize) ? -1 : 1;
        }
    });
    var ranks = temp_list.map(function(v){ return sorted.indexOf(v)+1 });
    return ranks;
}

function compute_mean_rank(data, tasks){
    let tmp_mean_rank = new Array(
        data["model"].length).fill(0);
    for (let [key, value] of Object.entries(data)) {
        if (!key.includes("_rank")){
            continue;
        }
        key = key.replace('_rank', '');
        if (tasks.has(key)){
            for (let i = 0; i < value.length; i++) {
                tmp_mean_rank[i] +=  (value[i]/tasks.size);}
        }
    } 
    return tmp_mean_rank;
}

function add_value_into_key_array(data, key, value){
    data[key] = data[key] || [ ];
    data[key].push(value);
}
function prepro_data(file){
    var raw_data = readTextFile(file);
    raw_data = raw_data.split("\n");

    var all_parsed_data = {
        "meta_ave": []
    };
    var retrieval_parsed_data = {
        "meta_ave": [],
    };
    var qa_parsed_data = {
        "meta_ave": [],
    };
    var caption_parsed_data = {
        "meta_ave": []
    };

    for (let i = 0; i < raw_data.length; i++) {
        let current_data = JSON.parse(raw_data[i]);
        let tmp_meta_ave_all = 0, tmp_meta_ave_retrieval =0 ;
        let tmp_meta_ave_qa = 0, tmp_meta_ave_caption = 0;
        for (let [key, value] of Object.entries(current_data)) {
            if (!all_tasks.has(key) && !key.includes("leaderboard")){
                if (current_data["value_leaderboard"]){
                    add_value_into_key_array(all_parsed_data, key, value);

                    add_value_into_key_array(retrieval_parsed_data, key, value);

                    add_value_into_key_array(qa_parsed_data, key, value);

                    add_value_into_key_array(caption_parsed_data, key, value);
                }else{
                    if (current_data["retrieval_leaderboard"]){
                        add_value_into_key_array(retrieval_parsed_data, key, value);
                    }

                    if (current_data["qa_leaderboard"]){
                        add_value_into_key_array(qa_parsed_data, key, value);
                    }

                    if (current_data["caption_leaderboard"]){
                        add_value_into_key_array(caption_parsed_data, key, value);
                    }
                }
            }
            if (retrieval_tasks.has(key)){
                if (value){
                    if (current_data["value_leaderboard"]){
                        tmp_meta_ave_all +=  value/all_tasks.size;
                        tmp_meta_ave_retrieval += value/retrieval_tasks.size;

                        add_value_into_key_array(all_parsed_data, key, value);
                        add_value_into_key_array(retrieval_parsed_data, key, value);
                    }else if (current_data["retrieval_leaderboard"]){
                        tmp_meta_ave_retrieval += value/retrieval_tasks.size;

                        add_value_into_key_array(retrieval_parsed_data, key, value);
                    }
                }
            }
            if (qa_tasks.has(key)){
                if (value){
                    if (current_data["value_leaderboard"]){
                        tmp_meta_ave_all +=  value/all_tasks.size;
                        tmp_meta_ave_qa += value/qa_tasks.size;
                        add_value_into_key_array(all_parsed_data, key, value);

                        add_value_into_key_array(qa_parsed_data, key, value);
                    }else if (current_data["qa_leaderboard"]){
                        tmp_meta_ave_qa += value/qa_tasks.size;

                        add_value_into_key_array(qa_parsed_data, key, value);
                    }
                }
            }
            if (caption_tasks.has(key)){
                if (value){
                    if (current_data["value_leaderboard"]){
                        tmp_meta_ave_all +=  value/all_tasks.size;
                        tmp_meta_ave_caption += value/caption_tasks.size;
                        add_value_into_key_array(all_parsed_data, key, value);

                        add_value_into_key_array(caption_parsed_data, key, value);
                    }else if (current_data["caption_leaderboard"]){
                        tmp_meta_ave_caption += value/caption_tasks.size;

                        add_value_into_key_array(caption_parsed_data, key, value);
                    }
                }
            } 
        }

        if (current_data["value_leaderboard"]){
            all_parsed_data["meta_ave"].push(tmp_meta_ave_all);
            retrieval_parsed_data["meta_ave"].push(tmp_meta_ave_retrieval);
            qa_parsed_data["meta_ave"].push(tmp_meta_ave_qa);
            caption_parsed_data["meta_ave"].push(tmp_meta_ave_caption);
        }else{
            if (current_data["retrieval_leaderboard"]){
                retrieval_parsed_data["meta_ave"].push(tmp_meta_ave_retrieval);
            }
            if (current_data["qa_leaderboard"]){
                qa_parsed_data["meta_ave"].push(tmp_meta_ave_qa);
            }
            if (current_data["caption_leaderboard"]){
                caption_parsed_data["meta_ave"].push(tmp_meta_ave_caption);
            }
        }
    }

    // compute rank
    all_tasks.forEach(key => {
        let ranks = compute_rank(all_parsed_data[key]);
        all_parsed_data[key + "_rank"] = ranks;
    })
    retrieval_tasks.forEach(key => {
        let ranks = compute_rank(retrieval_parsed_data[key]);
        retrieval_parsed_data[key + "_rank"] = ranks;
    })
    qa_tasks.forEach(key => {
        let ranks = compute_rank(qa_parsed_data[key]);
        qa_parsed_data[key + "_rank"] = ranks;
    })
    caption_tasks.forEach(key => {
        let ranks = compute_rank(caption_parsed_data[key]);
        caption_parsed_data[key + "_rank"] = ranks;
    })

    //compute mean rank and global rank
    all_parsed_data['mean_rank'] = compute_mean_rank(all_parsed_data, all_tasks);
    all_parsed_data['global_rank'] = compute_rank_break_tie(
        all_parsed_data["mean_rank"], all_parsed_data["meta_ave"]);

    retrieval_parsed_data['mean_rank'] = compute_mean_rank(retrieval_parsed_data, retrieval_tasks);
    retrieval_parsed_data['global_rank'] = compute_rank_break_tie(
        retrieval_parsed_data["mean_rank"], retrieval_parsed_data["meta_ave"]);

    qa_parsed_data['mean_rank'] = compute_mean_rank(qa_parsed_data, qa_tasks);
    qa_parsed_data['global_rank'] = compute_rank_break_tie(
        qa_parsed_data["mean_rank"], qa_parsed_data["meta_ave"]);

    caption_parsed_data['mean_rank'] = compute_mean_rank(caption_parsed_data, caption_tasks);
    caption_parsed_data['global_rank'] = compute_rank_break_tie(
        caption_parsed_data["mean_rank"], caption_parsed_data["meta_ave"]);
    console.log(caption_parsed_data)
    return {
        "value": all_parsed_data, 
        "ret": retrieval_parsed_data,
        "qa": qa_parsed_data,
        "caption": caption_parsed_data};
}


function deleteRow(rowid)  
{   
    var row = document.getElementById(rowid);
    row.parentNode.removeChild(row);
}

const createScoreboardTable = () => {
    while (scoreDiv.firstChild) scoreDiv.removeChild(scoreDiv.firstChild) // Remove all children from scoreboard div (if any)
        let scoreboardTable = document.createElement('table') // Create the table itself
        scoreboardTable.className = 'scoreboardTable'
        let scoreboardTableHead = document.createElement('thead') // Creates the table header group element
        scoreboardTableHead.className = 'scoreboardTableHead'
        let scoreboardTableHeaderRow = document.createElement('tr') // Creates the row that will contain the headers
        scoreboardTableHeaderRow.className = 'scoreboardTableHeaderRow'
        // Will iterate over all the strings in the tableHeader array and will append the header cells to the table header row
        tableHeaders.forEach(header => {
            let scoreHeader = document.createElement('th') // Creates the current header cell during a specific iteration
            scoreHeader.innerText = header
            scoreboardTableHeaderRow.append(scoreHeader) // Appends the current header cell to the header row
        })
        scoreboardTableHead.append(scoreboardTableHeaderRow) // Appends the header row to the table header group element
        scoreboardTable.append(scoreboardTableHead)
        let scoreboardTableBody = document.createElement('tbody') // Creates the table body group element
        scoreboardTableBody.className = "scoreboardTable-Body"
        scoreboardTable.append(scoreboardTableBody) // Appends the table body group element to the table
        scoreDiv.append(scoreboardTable) // Appends the table to the scoreboard div
}

// The function below will accept a single score and its index to create the global ranking
const appendScores = (scoreboardTable, singleScore, tasks) => {
    let scoreboardTableBodyRow = document.createElement('tr'); // Create the current table row
    // scoreboardTableBodyRow.className = 'scoreboardTableBodyRow';
    // Lines 72-85 create the 5 column cells that will be appended to the current table row
    let ranking = '<th scope="row"><p class="rank">'+ singleScore["global_rank"].toString() + '</p><span class="date badge badge-secondary">'+singleScore["date"]+'</span></th>';

    let model_detail = '<td style="word-break:break-word;">'+singleScore["model"]+'<p class="institution">'+singleScore["institution"]+'</p>';
    if (singleScore["paper_link"].length){
        model_detail += '<a href="'+singleScore["paper_link"]+ '" target="_blank">Paper</a>';
    }
    if (singleScore["code_link"].length){
        model_detail += '<a href="'+singleScore["code_link"]+ '" target="_blank">Code</a>';
    }
    model_detail += '</td>';

    // scores
    let score_prefix = '<td><b>', score_suffix = '</b></td>';
    
    let scores = "";
    scores += score_prefix + singleScore["mean_rank"].toFixed(2) + score_suffix;
    scores += score_prefix + singleScore["meta_ave"].toFixed(2) + score_suffix;
    tasks.forEach(key => {
        scores += score_prefix + singleScore[key].toFixed(2) + score_suffix;})

    scoreboardTableBodyRow.innerHTML = ranking + model_detail + scores;
    
    var tbodyRef = scoreboardTable.getElementsByTagName('tbody')[0];
    tbodyRef.append(scoreboardTableBodyRow); // Append the current row to the scoreboard table body
}

function getArray(object) {
    return Object.keys(object).reduce(function (r, k) {
        object[k].forEach(function (a, i) {
            r[i] = r[i] || {};
            r[i][k] = a;
        });
        return r;
    }, []);
}

function getObject(array) {
    return array.reduce(function (r, o, i) {
        Object.keys(o).forEach(function (k) {
            r[k] = r[k] || [];
            r[k][i] = o[k];
        });
        return r;
    }, {});
}

var all_data = prepro_data(data_path);
const allTable = document.getElementById("all_table");
const retTable = document.getElementById("ret_table"); 
const qaTable = document.getElementById("qa_table"); 
const captionTable = document.getElementById("caption_table"); 

let value_data = getArray(all_data["value"]);
value_data.sort((a, b) => (a.global_rank > b.global_rank) ? 1 : -1)
value_data.forEach(entry => {
    appendScores(allTable, entry, all_tasks);})

let ret_data = getArray(all_data["ret"]);
// console.log(ret_data)
ret_data.sort((a, b) => (a.global_rank > b.global_rank) ? 1 : -1)
ret_data.forEach(entry => {
    appendScores(retTable, entry, retrieval_tasks);})

let qa_data = getArray(all_data["qa"]);
qa_data.sort((a, b) => (a.global_rank > b.global_rank) ? 1 : -1)
qa_data.forEach(entry => {
    appendScores(qaTable, entry, qa_tasks);})

let caption_data = getArray(all_data["caption"]);
caption_data.sort((a, b) => (a.global_rank > b.global_rank) ? 1 : -1)
caption_data.forEach(entry => {
    appendScores(captionTable, entry, caption_tasks);})