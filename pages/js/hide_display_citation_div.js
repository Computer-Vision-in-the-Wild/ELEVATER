
const all_divs = new Array("bibtex_tvr", "bibtex_tvqa", "bibtex_tvc", "bibtex_vatex", "bibtex_violin", "bibtex_vlep", "bibtex_how2r", "bibtex_how2qa", "bibtex_youcook2");

function hide_display_citation_div(button_id){
    button_id = button_id.toString();
    display_div_name = button_id.toString().replace("button_", "")
    for (const divname of all_divs) {
        if (divname !== display_div_name){
            document.getElementById(divname).style.display='none';}
    }
    
    document.getElementById(display_div_name).style.display='block'; 
    
    
    return true;
}
