const path = require("path");
const fs = require("fs");
const { promisify } = require("util");

const readdir = promisify(fs.readdir);
const readfile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat)

async function bundleCss(dirName) {
  const now = new Date();
  const pathToBundlingDir = path.join(__dirname, dirName);
  const pathToDistFile = path.join(__dirname, "dist/bundle.css");

  const bundleContent = await getDirContent(pathToBundlingDir, dirName)

  async function getDirContent (pathToDir, dirName) {
    let dir = await readdir(pathToDir);
    if (dir.length === 0) {
      return undefined
    }
    let bundleContent = `/*##Bundle from ./${dirName} start*/\n\n`

    dir = await Promise.all(
      dir.map(async (file) => {
        const pathToFile = path.join(pathToDir, file)
        const typeFile = await stat(pathToFile)
        if (typeFile.isDirectory()) {
          bundleContent = bundleContent
            .concat(await getDirContent(pathToFile, file))
          return undefined
        } else {
          return readfile(path.join(pathToDir, file))
        }
      })
    );
    dir = dir.filter((item) => item instanceof Buffer)
  
    bundleContent = bundleContent.concat(
      dir.reduce((result, current) => {
        return `${"\n" + result + "\n" + current}\n`;
      })
    );

    return bundleContent
      .concat(`\n/*##Bundle from ./${dirName} end*/\n\n`)
  }
  

  writeFile(pathToDistFile, bundleContent).then(() =>
    console.log(`Successfuly bundled in : ${(Date.now() - now) / 1000}sec`)
  );
}

bundleCss("src").catch(err => console.log(err));
