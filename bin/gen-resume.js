const JSYaml = require("js-yaml");
const path = require("path");
const fsPromises = require("fs").promises;
const util = require("util");

const DATA_FOLDER = path.resolve(__dirname, "..", "_data");
const ROLE_FOLDER = path.resolve(__dirname, "..", "roles");

async function getData(basename) {
  const fileContents = await fsPromises.readFile(path.resolve(DATA_FOLDER, basename + ".yaml"));
  return JSYaml.safeLoad(fileContents);
}

function idList(data, ...recursive) {
  const [head, ...tail] = recursive;
  if (!Array.isArray(data)) {
    return [];
  } else if (!head) {
    return data.map((it) => it.id);
  } else {
    return Object.fromEntries(data.map((it) => {
      return [it.id, idList(it[head], ...tail)];
    }))
  }
}

async function generateFilterObject() {
  const awardsAsync = getData("awards");
  const contactAsync = getData("contact");
  const educationAsync = getData("education");
  const experienceAsync = getData("experience");
  const skillsAsync = getData("skills");
  return {
    awards: idList((await awardsAsync).awards),
    contacts: idList((await contactAsync).methods),
    education: idList((await educationAsync).programs),
    experience: Object.fromEntries(Object.entries(idList((await experienceAsync).roles, "achievements")).map(([key, items]) => {
      return [key, ["description", ...items]]
    })),
    skills: idList((await skillsAsync).categories, "skills")
  }
}

async function generateResumeTemplate(name) {
  const header = {filter: await generateFilterObject()};
  const filename = path.resolve(ROLE_FOLDER, name.toLowerCase().endsWith(".md") ? name : name + ".md");
  await fsPromises.writeFile(filename, "---\n" + JSYaml.safeDump(header) + "\n---\n\n(Fill me in!)", {flag: "wx"});
  return filename;
}

function main() {
  if (process.argv.length < 3 || process.argv.length > 3) {
    console.log(`Need one argument: the name of the file. But got ${process.argv.length - 2}.`);
    return;
  }

  const name = process.argv[2];

  generateResumeTemplate(name).then((filename) => {
    console.log(`Successfully wrote ${filename}.`);
  }).catch((err) => {
    console.log(`Couldn't write template: ${err}.`);
  });
}

main();
