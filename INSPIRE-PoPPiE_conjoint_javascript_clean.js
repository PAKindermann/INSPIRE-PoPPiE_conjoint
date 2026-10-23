Qualtrics.SurveyEngine.addOnload(function()
{
// Attributes and Levels stored in a 2-dimensional Array 

/* Randomise array in-place using Durstenfeld shuffle algorithm */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return(array);
}

// function to generate weighted random numbers
function weighted_randomize(prob_array, at_key)
{
	var prob_list = prob_array[at_key];
	
	// create an array containing cutpoints for randomisation
	var cumul_prob = new Array(prob_list.length);
	var cumulative = 0.0;
	for (var i=0;  i < prob_list.length; i++){
		cumul_prob[i] = cumulative;
		cumulative = cumulative + parseFloat(prob_list[i]);
	}

	// generate uniform random floating point value between 0.0 and 1.0
	var unif_rand = Math.random();

	// which integer should be returned
	var outInt = 0;
	for (var k = 0; k < cumul_prob.length; k++){
		if (cumul_prob[k] <= unif_rand){
			outInt = k + 1;
		}
	}

	return(outInt);

}
                    
var featurearray = {"Selection" : ["\u2026 durch die gezielte Auswahl von Personen, die die allgemeine Bev\u00F6lkerung widerspiegeln sollen.","\u2026 durch ein offenes Verfahren, in dem sich alle Interessierten melden k\u00F6nnen.","\u2026 durch die gezielte Auswahl von Personen, die in der Politik unterrepr\u00E4sentiert sind, insbesondere junge Menschen.","\u2026 durch die gezielte Auswahl von Personen, die in der Politik unterrepr\u00E4sentiert sind, insbesondere Menschen aus der Arbeiterschaft.","\u2026 durch die gezielte Auswahl von Personen, die in der Politik unterrepr\u00E4sentiert sind, insbesondere Menschen mit Migrationshintergrund.","\u2026 durch die gezielte Auswahl von Personen, die in der Politik unterrepr\u00E4sentiert sind, insbesondere ehemalige Straft\u00E4ter."],"Policy" : ["\u2026 eine Reform des Wahlalters.","\u2026 eine Reform des Arbeitsrechts und des K\u00FCndigungsschutzes.","\u2026 eine Reform des Staatsb\u00FCrgerrechts und der Einb\u00FCrgerungsregeln.","\u2026 eine Reform von Strafrecht und Strafma\u00DF."],"Communication" : ["\u2026 direkt mit politischen Entscheidungstr\u00E4gern.","\u2026 mit anderen Teilnehmenden, die einen \u00E4hnlichen Hintergrund haben wie sie.","\u2026 mit anderen Teilnehmenden, die ganz andere Erfahrungen und Sichtweisen haben als sie."],"Participation" : ["\u2026 \u00FCber verschiedene politische Vorschl\u00E4ge diskutieren, die von Expertinnen und Experten vorgestellt werden.","\u2026 ihre Ideen auf kreative Weise vermitteln, zum Beispiel durch das Nachspielen eigener Erfahrungen."],"Duration" : ["\u2026 relativ lang, zum Beispiel neun Tage verteilt \u00FCber vier Monate.","\u2026 relativ kurz, zum Beispiel ein Abendtermin."],"Authority" : ["\u2026 die Ergebnisse des Verfahrens zur Kenntnis nehmen.","\u2026 erkl\u00E4ren, welche Ergebnisse des Verfahrens umgesetzt werden und welche nicht, und warum.","\u2026 die Ergebnisse des Verfahrens umsetzen."]};

var restrictionarray = [];

var probabilityarray = {"Selection" : [0.25,0.25,0.125,0.125,0.125,0.125],"Policy" : [0.25,0.25,0.25,0.25],"Communication" : [0.3333333333333333,0.3333333333333333,0.3333333333333333],"Participation" : [0.5,0.5],"Duration" : [0.5,0.5],"Authority" : [0.3333333333333333,0.3333333333333333,0.3333333333333333]};

// enable weigthed randomisation
var weighted = 1;

// K = number of tasks displayed to the respondent
var K = 4;

// N = number of profiles displayed in each task
var N = 2;

// num_attributes = number of attributes in the array
var num_attributes = featurearray.length;

// Should duplicate profiles be rejected?
var noDuplicateProfiles = false;

// place $featurearray keys into a new array
var featureArrayKeys = Object.keys(featurearray);
var featureArrayNew = featurearray;

// Fix positions 1 (Selection) and 2 (Policy); randomise positions 3-6 (Communication, Participation, Duration, Authority) ONCE PER RESPONDENT. Computed before the task loop = the order is constant across all of a respondent's tasks (respondent-level rather than task-level). 
var fixedHead    = featureArrayKeys.slice(0, 2);             // [Selection, Policy]
var shuffledTail = shuffleArray(featureArrayKeys.slice(2)); // [Comm,Part,Dur,Auth] shuffled
featureArrayKeys = fixedHead.concat(shuffledTail);
// ====================================================================

// Initialise the array returned to the user
// Naming Convention
// Level Name: F-[task number]-[profile number]-[attribute number]
// Attribute Name: F-[task number]-[attribute number]
// Example: F-1-3-2, returns the level corresponding to Task 1, Profile 3, Attribute 2 
// F-3-3, returns the attribute name corresponding to Task 3, Attribute 3

// ===== German display labels for piped row labels =====
// The attribute-NAME field F-[task]-[attr] is stored as the German display label (not the internal key) = the profile table can pipe it as the row label. This is required because the attribute order is randomised (rows 3-6 vary per respondent) and the labels can no longer be hardcoded in the HTML
var displayLabels = {
    "Selection":     "Die Auswahl der Teilnehmenden erfolgt:",
    "Policy":        "Inhaltlich geht es bei dem Verfahren um:",
    "Communication": "Die <u>Teilnehmenden kommunizieren</u> vorrangig:",
    "Participation": "Im Verfahren werden die Teilnehmenden:",
    "Duration":      "Die <u>Dauer</u> des Verfahrens ist:",
    "Authority":     "Die <u>Politik muss</u>:"
};
// ========================================================================

var returnarray = {};

// for each task $p
for(var p = 1; p <= K; p++){

	// for each profile $i
	for(var i = 1; i <= N; i++){

		// repeat until non-restricted profile has been generated
		var complete = false;

		while (complete == false){

			// create a count for $attributes to be incremented in the next loop
			var attr = 0;
			
			// create a dictionary to hold profile's attributes
			var profile_dict = {};

			// for each attribute $attribute and level array $levels in task $p
			for(var q = 0; q < featureArrayKeys.length; q++){
				// Get Attribute name
				var attr_name = featureArrayKeys[q];
					
				// increment attribute count
				attr = attr + 1;
	
				// create key for attribute name
				var attr_key = "F-" + p + "-" + attr;
	
                // store attribute name in returnarray
                returnarray[attr_key] = displayLabels[attr_name];   // store German label, not internal, English key

				// retrieve length of levels array
				var num_levels = featureArrayNew[attr_name].length;

				// randomly select one of the level indices
				if (weighted == 1){
					var level_index = weighted_randomize(probabilityarray, attr_name) - 1;

				}else{
					var level_index = Math.floor(Math.random() * num_levels);
				}	

				// pull the selected level
				var chosen_level = featureArrayNew[attr_name][level_index];
				
				// store selected level in profileDict
				profile_dict[attr_name] = chosen_level;
	
				// create key for level in $returnarray
				var level_key = "F-" + p + "-" + i + "-" + attr;
	
				// store selected level in $returnarray
				returnarray[level_key] = chosen_level;

			}

            var clear = true;
            
            // cycle through restrictions to confirm/reject profile
            if (restrictionarray.length != 0){
                for (var v = 0; v < restrictionarray.length; v++){
                    var falsevar = 1;
                    for (var mp = 0; mp < restrictionarray[v].length; mp++){
                        if (profile_dict[restrictionarray[v][mp][0]] == restrictionarray[v][mp][1]){
                            falsevar = falsevar*1;
                        }else{
                            falsevar = falsevar*0;
                        }							
                    }
                    if (falsevar == 1){
                        clear = false;
                    }
                }
            }
                            
            // IF ducplicates removed:
            if (noDuplicateProfiles == true){
                // cycle through all previous profiles to confirm no identical profiles
                if (i > 1){    
                    // for each previous profile
                    for(var z = 1; z < i; z++){
    					
                        // start by assuming it's the same
                        var identical = true;
    					
                        // create a count for $attributes to be incremented in the next loop
                        var attrTemp = 0;
    					
                        // for each attribute $attribute and level array $levels in task $p
                        for(var qz = 0; qz < featureArrayKeys.length; qz++){
    						
                            // increment attribute count
                            attrTemp = attrTemp + 1;
    
                            // create keys 
                            var level_key_profile = "F-" + p + "-" + i + "-" + attrTemp;
                            var level_key_check = "F-" + p + "-" + z + "-" + attrTemp;
    						
                            // if attributes are different, declare they are not identical
                            if (returnarray[level_key_profile] != returnarray[level_key_check]){
                                identical = false;
                            }
                        }
                        // if we detect an identical profile, reject
                        if (identical == true){
                            clear = false;
                        }
                    }                
                }
            }
            complete = clear;
        }
    }
}
                            
// Write returnarray to Qualtrics
// MODIFICATION of conjoont survey tool: replace Qualtrics.SurveyEngine.setEmbeddedData(...) with Qualtrics.SurveyEngine.setJSEmbeddedData(...) to fit Qualtrics' New Survey Taking Experience, where setEmbeddedData(...) has been deprecated

var returnarrayKeys = Object.keys(returnarray);

for (var pr = 0; pr < returnarrayKeys.length; pr++){
       Qualtrics.SurveyEngine.setJSEmbeddedData(returnarrayKeys[pr], returnarray[returnarrayKeys[pr]]); 
}
});

Qualtrics.SurveyEngine.addOnReady(function()
{
	/*Place your JavaScript here to run when the page is fully displayed*/

});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});