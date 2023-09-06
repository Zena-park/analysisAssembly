const fs = require("fs");
var path = require("path");
const _ = require("lodash");
const { isNull } = require("util");


const opcodes = ['ADD','MUL','SUB','DIV','SDIV','MOD','SMOD','ADDMOD','MULMOD','EXP',
                'SIGNEXTEND','LT','GT','SLT','SGT','EQ','ISZERO',
                'AND','OR','XOR','NOT',
                'BYTE','SHL','SAR','KECCAK256']
let opcodeCounts = {
    'ADD': 0,
    'MUL': 0,
    'SUB': 0,
    'DIV': 0,
    'SDIV': 0,
    'MOD': 0,
    'SMOD': 0,
    'ADDMOD': 0,
    'MULMOD': 0,
    'EXP': 0,
    'SIGNEXTEND': 0,
    'LT': 0,
    'GT': 0,
    'SLT': 0,
    'SGT': 0,
    'EQ': 0,
    'ISZERO': 0,
    'AND': 0,
    'OR': 0,
    'XOR': 0,
    'NOT': 0,
    'BYTE': 0,
    'SHL': 0,
    'SAR': 0,
    'KECCAK256': 0
}

let tagContentsInterface = {
    tagNumber: Number,
    tagContents: String,
    inTags: [],
    opcodeCounts: opcodeCounts,
    totalOperations: Number
}

let tagContentsClone = {
    tagNumber: 0,
    tagContents: '',
    inTags: [],
    opcodeCounts: null,
    totalOperations: 0
}

let tagTotalCount = 0;
let tagNumbers = [] // Array<number>
let tagContentsList = [] // Array< {tagNumber: , tagCons: }>
let tagOperations = [] //
let data ;
let tagArray = []

// 태그 목록 만들기
function extractTagNumbers(indata) {
    let tab = "\t"
    let searchvalueTag = "PUSH [tag] "
    var rows = indata.split("\n");
    let i = 0 ;
    let j = 0;
    for (i = 0; i < rows.length; i++) {
    // for (i = 0; i < 20; i++) {
        var columns = rows[i].split("\t");
        for(j = 0; j < columns.length; j++){
            index = columns[j].indexOf(searchvalueTag, 0)
            // console.log('index',index)
            if (index > 0) {
                var cell = columns[j].split(searchvalueTag);
                let no = parseInt(cell[1])
                // console.log(no)
                if(!tagNumbers.includes(no)) tagNumbers.push(no)
            }
        }
    }
    // console.log(tagNumbers)
}

// 모든 태그의 내용 읽고 저장
function readAllTags(){
    tagNumbers.forEach(e=>{
        fillTagContents(data, e)
    })
}

// 특정 태의 내용 , 태그, 오퍼레이션 개수 저장 .
function fillTagContents(indata, tagNumber){
    // console.log( 'read  : Tag ', tagNumber)
    let searchvalueTag = "    tag "+tagNumber+"\t"
    let index = indata.indexOf(searchvalueTag, 0)

    let resultTagContents = _.clone(tagContentsClone)
    resultTagContents.tagNumber = tagNumber

    if(index == -1) {
        index = indata.indexOf("    tag "+tagNumber+"\n", 0)
    }
    if (index > 0){
        let index2 = indata.indexOf('    tag ', index+1)
        let contents = indata.substring(index, index2)
        resultTagContents.tagContents = tagNumber

        let result = extractOperationAndTags(contents)
        resultTagContents.tagContents = contents
        resultTagContents.opcodeCounts = result.opcodeCount
        resultTagContents.totalOperations = result.sum
        resultTagContents.inTags = result.inTags
    }

    if(!existeTagCons(tagNumber))
        tagContentsList.push({tagNumber: tagNumber, tagCons: resultTagContents})

    return resultTagContents;
}

function existeTagCons (tagNum) {
    for(let i=0; i < tagContentsList.length; i++)
        if(tagContentsList[i].tagNumber == tagNum)  return true;

    return false;
}

function findTagCons (tagNum) {
    for(let i=0; i < tagContentsList.length; i++)
        if(tagContentsList[i].tagNumber == tagNum)  return tagContentsList[i];

    return null;
}
// 매칭되는 단어수 리턴
function totalCountsMatched(contents, searchValue) {
    let boolWhile = true
    let position = 0
    let index = 0
    let sum = 0
    let searchValueKey
    while (boolWhile) {
        searchValueKey = searchValue+'\t'
        index = contents.indexOf(searchValue, position)
        if (index > 0) {
            position = index +1;
            sum++
        } else {
            searchValueKey = searchValue+'\n'
            index = contents.indexOf(searchValue, position)
            if (index > 0) {
                position = index +1;
                sum++
            } else {
                boolWhile = false
            }
        }
        index = 0
    }
    return sum;
}

// 오퍼레이션과 태그 파싱
function extractOperationAndTags(contents) {
    let i = 0;
    let searchValue;
    let sum = 0
    contents = contents+'\n'

    let opCounts = _.clone(opcodeCounts)
    let result = {
        opcodeCount: null,
        sum: 0,
        inTags: []
    };
    for(i = 0; i < opcodes.length; i++){
        searchValue = opcodes[i]
        let matchedCount = totalCountsMatched(contents, searchValue)
        // console.log('searchValue', searchValue ,'matchedCount',matchedCount)
        opCounts[searchValue] = matchedCount
        sum += matchedCount

    }
    result.opcodeCount = opCounts
    result.sum = sum

    // find tags in module
    let searchvalueTag = "PUSH [tag] "
    var rows = contents.split("\n");
    let ii = 0
    let j = 0;
    for (ii = 0; ii < rows.length; ii++) {
        // console.log(rows[ii])
        var columns = rows[ii].split("\t");
        for(j = 0; j < columns.length; j++){
            index = columns[j].indexOf(searchvalueTag, 0)
            // console.log('index',index)
            if (index > 0) {
                var cell = columns[j].split(searchvalueTag);
                let no = parseInt(cell[1])
                // console.log('in Tag ',no)
                result.inTags.push(no)
            }
        }
    }

    return  result
}


function readTags(tagNumber) {
    return fillTagContents(data, tagNumber)
}

function sumOfTotalOperationCountsTags(tagNumber, totalOperation) {
    let tag = findTagCons(tagNumber)
    if(tag != null && tag.tagCons !=null ){
        totalOperation += tag.tagCons.totalOperations
        if(tag.tagCons.inTags != null && tag.tagCons.inTags.length > 0) {
            for(let i=0; i< tag.tagCons.inTags.length; i++) {
                totalOperation = sumOfTotalOperationCountsTags(tag.tagCons.inTags[i], totalOperation)
                // console.log(i, '-- totalOperation', totalOperation)
            }
        }
    }

    return totalOperation;
}


function existLoop(tagNumber, inTags) {
    console.log(tagNumber, 'inTags', inTags, 'inTags.includes(tagNumber)', inTags.includes(tagNumber))
    let res = {
        loop: false,
        lastTagPath: null,
        startLoopTag: null
    }
    let tag = findTagCons(tagNumber)

    if(inTags.includes(tagNumber) && tag.tagCons.inTags.length > 0) {
        res.loop = true;
        res.lolastTagPathop = inTags;
        res.startLoopTag = tagNumber;
        return res;
    }

    inTags.push(tagNumber)
    let boolLoop = false;
    if(tag != null && tag.tagCons !=null ){
        if(tag.tagCons.inTags != null && tag.tagCons.inTags.length > 0) {
            for(let i=0; i< tag.tagCons.inTags.length; i++) {
                let result = existLoop(tag.tagCons.inTags[i], inTags)
                if(result.loop == true) {
                    res = result;
                    break;
                }
            }
        }
    }
    return res;
}


function arrayInTags(tagNumber, inTags) {
    inTags.push(tagNumber)
    let tag = findTagCons(tagNumber)
    if(tag != null && tag.tagCons !=null ){
        if(tag.tagCons.inTags != null && tag.tagCons.inTags.length > 0) {
            for(let i=0; i< tag.tagCons.inTags.length; i++) {
                arrayInTags(tag.tagCons.inTags[i], inTags)
                // console.log(i, '-- totalOperation', totalOperation)
            }
        }
    }

    return inTags;
}


function readLoopTags(tagsArray) {
    let boolWhile = true;
    let tagResultArrays = [];
    while (boolWhile) {
        console.log('readLoopTags length',tagsArray, tagsArray.length)
        if(tagsArray.length == 0) {
            boolWhile = false;
        } else {
            let i = 0;
            for (i = 0; i < tagsArray.length; i++ ) {
                // tagResult = readTags(tagResult.inTags[i])
                console.log('readTags ', tagsArray[i]);
                let tagResult = readTags(tagsArray[i])
                console.log('tagResult', tagsArray[i], tagResult)
            }
            boolWhile = false;
        }
    }
    console.log("loopReadTags end  ")
    return;
}


const getData = (filename) => {
    const csvPath = path.join(__dirname,  '../'+filename ) // 두번째 인
    console.log(csvPath)
    const contents = fs.readFileSync(csvPath, "utf-8")
    data = contents;
    // console.log(data)
}

function check(tagNum) {
    console.log('\n//======================= Tag Number ', tagNum)
    tagArray = []
    let sum = 0;
    let boolLoop = existLoop(tagNum, tagArray)

    if(boolLoop.loop) {
        console.log('existLoop', boolLoop)

    } else {
        tagArray  =  arrayInTags(tagNum, tagArray)
        tagArray.forEach(e=>{
            let tag = findTagCons(e)
            sum += tag.tagCons.totalOperations
        })
        console.log('sum Of TotalOperationCounts in Tags', tagNum, ' : ', sum ,' operations')
    }
}
async function main() {

    // //=============================
    // //  Read Data
    // getData("inputFile/assembly_caInterest.txt")
    // // findTagTotalCount()
    // extractTagNumbers(data)
    // readAllTags()
    // // let res = findTagCons (86)
    // // console.log(res)

    // // let res = fillTagContents(data, 0)
    // // console.log(res)
    // check(2)
    // // check(3)

    //=============================
    //  Read Data
    getData("inputFile/assembly_UniswapV3Pool1.txt")
    // findTagTotalCount()
    extractTagNumbers(data)
    readAllTags()
    // let res = findTagCons (86)
    // console.log(res)

    // let res = fillTagContents(data, 0)
    // console.log(res)
    check(4)
    // check(3)
    check(115)

    let res = findTagCons (115)
    console.log(res)
     res = findTagCons (114)
    console.log(res)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

