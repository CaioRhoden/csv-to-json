//get the csv as a string
function getCsv(fileName) {
  let fs = require("fs");
  return fs.readFileSync(fileName, "utf8");
}

//get the name as a string
function getName(lineInfo, fields) {
  i = fields.indexOf("fullname");
  return lineInfo[i];
}

//get the eid as a string
function getId(lineInfo, fields) {
  i = fields.indexOf("eid");
  return lineInfo[i];
}

//get an array with all the classes
function getClasses(lineInfo, fields) {
  let compare;
  let classes = [];

  //search in all the fields for the "class"
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].localeCompare("class") == 0) {
      compare = lineInfo[i].localeCompare("");
      //verify if the info of the class isn't "" and its justa one class
      if (compare != 0 && lineInfo[i].length > 8) {
        sepIndex = lineInfo[i].search(/\d/i);
        //get the separator
        if (lineInfo[i][sepIndex + 1].localeCompare(" ") == 0) {
          sep = " ".concat(lineInfo[i][sepIndex + 2]);
          sep = sep.concat(" ");
        } else {
          sep = lineInfo[i][sepIndex + 1];
        }
        //split the classes into an array
        let classesTag = lineInfo[i].split(sep);

        for (let j = 0; j < classesTag.length; j++) {
          //append classes in the array that will be returned
          classes.push(classesTag[j]);
        }
        //verify if its just one class
      } else if (
        compare != 0 &&
        lineInfo[i].length <= 8 &&
        lineInfo[i][lineInfo[i].length - 1].search(/\d/i) != -1
      ) {
        classes.push(lineInfo[i]);
      }
    }
  }
  return classes;
}

//get the email
function getEmail(lineInfo) {
  return lineInfo.match(/[\w\d]+@[\w\d]+.[\w\d]+/i)["input"];
}

//verify if its a valid email
function verifyEmail(lineInfo, index) {
  if (lineInfo[index].search(/[\w\d]+@[\w\d]+.[\w\d]+/i) > -1) return true;
  return false;
}

//get the adresses dict
function getAdresses(lineInfo, fields) {
  const phoneUtil = require("google-libphonenumber").PhoneNumberUtil.getInstance();
  let adressesArr = [];
  //run for all the fields
  for (i = 0; i < fields.length; i++) {
    field = fields[i];
    //split the tags
    let arr = field.split(" ");
    //conditional to get email's field
    if (arr[0].localeCompare("email") == 0) {
      if (
        lineInfo[i].localeCompare("") != 0 &&
        verifyEmail(lineInfo, i) == true
      ) {
        //split the email field
        emailsArr = lineInfo[i].split("/");
        for (k = 0; k < emailsArr.length; k++) {
          //for each email its created and appended a dict in the array of adresses
          email = getEmail(emailsArr[k]);
          let adressDict = {};
          adressDict["adress"] = email;
          adressDict["type"] = arr[0];
          adressDict["tags"] = [];
          for (j = 1; j < arr.length; j++) {
            if (arr[j] != "") {
              //verify if the tags contain "," and remove it
              if (arr[j][arr[j].length - 1].localeCompare(",") == 0)
                arr[j] = arr[j].substring(0, arr[j].length - 1);
              adressDict["tags"].push(arr[j]);
            }
          }

          adressesArr.push(adressDict);
        }
      }
      //get the phone's field
    } else if (arr[0].localeCompare("phone") == 0) {
      //verify if its just numbers and not void input
      if (lineInfo[i].search(/[A-z]/) == -1 && lineInfo[i] != "") {
        let number = phoneUtil.parse(lineInfo[i], "BR");
        //verify if it is a possible phone number
        if (
          lineInfo[i].localeCompare("") != 0 &&
          phoneUtil.isValidNumber(number) == true
        ) {
          let adressDict = {};
          //append the phone number using just natural numbers
          adressDict["adress"] = "55".concat(number.getNationalNumber());
          adressDict["type"] = arr[0];
          adressDict["tags"] = [];
          for (j = 1; j < arr.length; j++) {
            if (arr[j] != "") {
              //remove the "," of the tags
              if (arr[j][arr[j].length - 1].localeCompare(",") == 0)
                arr[j] = arr[j].substring(0, arr[j].length - 1);
              adressDict["tags"].push(arr[j]);
            }
          }

          adressesArr.push(adressDict);
        }
      }
    }
  }
  return adressesArr;
}

//find the index of see_all and get its value
function getSeeAll(lineInfo, fields) {
  i = fields.indexOf("see_all");
  if (lineInfo[i].localeCompare("yes") == 0) return true;
  else return false;
}

//find the index of invisible and gets its value
function getInvisible(lineInfo, fields) {
  i = fields.indexOf("invisible");
  if (lineInfo[i].localeCompare("1") == 0) return true;
  else return false;
}

//verify, in the case where a id already added to the dict, if there are new valid adresses to append
//or change with the already existing adresses
function compareAdresses(oldAdresses, newAdresses) {
  changed = false;
  //run all the already existing adresses and the new ones too
  for (j = 0; j < oldAdresses.length; j++) {
    for (i = 0; i < newAdresses.length; i++) {
      //verify if its a email's adress and if it has the same number of tags
      if (
        newAdresses[i]["type"] == "email" &&
        newAdresses[i]["type"] == oldAdresses[j]["type"] &&
        newAdresses[i]["tags"].length == oldAdresses[j]["tags"].length
      ) {
        //veirfy if it is the same tags
        if (
          JSON.stringify(newAdresses[i]["tags"]) ==
          JSON.stringify(oldAdresses[j]["tags"])
        ) {
          //change the adress for a new one
          oldAdresses.push(newAdresses[i]);
          changed = true;
        }
      }
    }
    if ((changed = true)) {
      oldAdresses.splice(j, 1);
    }
    changed = false;
    break;
  }
  //verify if there are new phone numbers, in a positive case, add them to the existing adresses
  for (i = 0; i < newAdresses.length; i++) {
    if (newAdresses[i]["type"] == "phone") oldAdresses.push(newAdresses[i]);
  }
  return oldAdresses;
}

//creates one dict per line
function makeLineDict(fields, line, results) {
  let lineDict = {};
  let lineInfo = line.split(",");

  //verify if this id was already used
  id = getId(lineInfo, fields);
  for (let i = 0; i < results.length; i++) {
    if (results[i]["eid"].localeCompare(id) == 0) {
      let additionalClasses = [];
      //in a positive case, it makes the necessary changes
      additionalClasses = getClasses(lineInfo, fields);
      for (let j = 0; j < additionalClasses.length; j++)
        results[i]["classes"].push(additionalClasses[j]);
      newAdresses = getAdresses(lineInfo, fields);
      results[i]["adresses"] = compareAdresses(
        results[i]["adresses"],
        newAdresses
      );
      if (results[i]["invisible"] == false)
        results[i]["invisible"] = getSeeAll(lineInfo, fields);
      if (results[i]["see_all"] == false)
        results[i]["see_all"] = getSeeAll(lineInfo, fields);
      return results;
    }
  }

  //if the id isn't in the results dictionary
  lineDict["fullname"] = getName(lineInfo, fields);
  lineDict["eid"] = id;
  lineDict["classes"] = getClasses(lineInfo, fields);
  lineDict["adresses"] = getAdresses(lineInfo, fields);
  lineDict["invisible"] = getInvisible(lineInfo, fields);
  lineDict["see_all"] = getSeeAll(lineInfo, fields);
  results.push(lineDict);
  return results;
}

//solve the problem if there is ',' inside of some field 'class'
function changeClassSeparator(line) {
  let ini;
  let end;
  ini = line.search(/"Sala/i);
  end = line.search(/Sala \d"/i);
  line = line.replace(/"/, "");
  line = line.replace(/"/, "");
  for (let i = ini; i < end + 4; i++) {
    if (line[i].localeCompare(",") == 0) {
      let aux = line.substring(i + 2, line.length);
      line = line.substring(0, i).concat(";");
      line = line.concat(aux);
    }
  }
  return line;
}

function main() {
  let data;
  let results = [];
  data = getCsv("input.csv");

  //creating an array with the lines of the csv
  data = data.replace('"', "").split("\n");

  //creating an array with the fields of the csv
  fields = data[0].split(",");
  fields[4] = fields[4].concat(", ");
  fields[4] = fields[4].concat(fields[5]);
  fields[7] = fields[7].concat(", ");
  fields[7] = fields[7].concat(fields[8]);
  fields.splice(5, 1);
  fields.splice(7, 1);
  fields[4] = fields[4].substring(0, fields[4].length - 1);
  fields[6] = fields[6].substring(1, fields[6].length - 1);

  //make a dict of every line and append it in to the results
  for (let i = 1; i <= 4; i++) {
    if (data[i].search(/"Sala/i) != -1) {
      data[i] = changeClassSeparator(data[i]);
    }
    results = makeLineDict(fields, data[i], results);
  }
  let output = JSON.stringify(results);
  var fs = require("fs");
  fs.writeFileSync("output.json", output);
}

main();
