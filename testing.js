/*
    Given a colon-delimited path (e.g., "MEI-Test-Set:accidentals"),
    looks up the data in the tests.json file and renders them with Verovio.

    Assumes the MEI files are in a folder called "MEI". 
*/
runTests = function(path)
{
    function _selectTests(path, data)
    {
        // selects the tests and returns the test object
        var pathArray = path.split(":");

        if (!data.hasOwnProperty(pathArray[0]) || !data[pathArray[0]].hasOwnProperty(pathArray[1]))
        {
            console.error('No test for ' + path + " was found");
        }

        return data[pathArray[0]][pathArray[1]];
    }

    function _styleTestStatus (sibelius, verovio)
    {
        var testStatusList = document.createElement('ul');
        var sibeliusStatus = sibelius ? "Pass" : "Fail";
        var verovioStatus = verovio ? "Pass" : "Fail"
        var sibeliusListItem = document.createElement("li");
        var verovioListItem = document.createElement("li")

        if (sibelius)
        {
            sibeliusListItem.setAttribute("style", "color:green;");
        }
        else
        {
            sibeliusListItem.setAttribute("style", "color:red;");
        }

        if (verovio)
        {
            verovioListItem.setAttribute("style", "color:green;")
        }
        else
        {
            verovioListItem.setAttribute("style", "color:red");
        }

        var sibeliusStatusText = document.createTextNode("Sibelius: " + sibeliusStatus);
        sibeliusListItem.appendChild(sibeliusStatusText);
        testStatusList.appendChild(sibeliusListItem);

        var verovioStatusText = document.createTextNode("Verovio: " + verovioStatus);
        verovioListItem.appendChild(verovioStatusText);
        testStatusList.appendChild(verovioListItem);

        return testStatusList;
    }

    function _parseMEIDataForDisplay (data)
    {
        // @TODO Parse the MEI file so we can display the sibmei version.
        var domparser = new window.DOMParser();
        var meiXML = domparser.parseFromString(data, "application/xml");
        var appInfo = meiXML.querySelector("[*|id=sibmei]");

        if (appInfo !== null && sibmeiVersion !== null)
        {
            var sibmeiVersion = appInfo.getAttribute('version');
            return "Sibelius MEI Plugin Version: " + sibmeiVersion;
        }

        return null;
    }

    function _runTests (path, data)
    {
        var keys = Object.keys(data);
        var vrvToolkit = new verovio.toolkit();
        var vrvOptions = {scale: 50, adjustPageHeight: 1}
        vrvToolkit.setOptions(vrvOptions);

        var outputDiv = document.getElementById('test-output');

        var verovioVersionText = document.createTextNode("Rendered with Verovio " + vrvToolkit.getVersion());
        var verovioVersionP = document.createElement("p");
        verovioVersionP.appendChild(verovioVersionText);
        outputDiv.appendChild(verovioVersionP);
        
        var verovioOptionsText = document.createTextNode("Options: ");
        outputDiv.appendChild(verovioOptionsText);

        var verovioOptionsUL = document.createElement('ul');

        for (opt in vrvOptions)
        {
            var li = document.createElement('li');
            var value = document.createTextNode(opt + ": " + vrvOptions[opt]);
            li.appendChild(value);
            verovioOptionsUL.appendChild(li);
        }
        outputDiv.appendChild(verovioOptionsUL);

        var topHr = document.createElement("hr");
        outputDiv.appendChild(topHr);

        for (var i = 0, len = keys.length; i < len; i++)
        {
            // implement a closure so that we can pass in the value of 'i' to a callback.
            (function (i)
            {
                var fetchTest = new XMLHttpRequest();
                fetchTest.onload = function(args)
                {
                    var response = fetchTest.responseText;
                    var svg = vrvToolkit.renderData(response, {});

                    var testDiv = document.createElement('div');
                    var testHeader = document.createElement('h2');
                    var testHeaderText = document.createTextNode(data[keys[i]][2]);
                    testHeader.appendChild(testHeaderText);
                    testDiv.appendChild(testHeader);

                    var filenameElement = document.createElement("p");
                    var filenameLinkElement = document.createElement("a");
                    filenameLinkElement.setAttribute('href', "../" + testLocation[0] + "/MEI/" + testLocation[1] + "/" + keys[i]);
                    filenameElement.appendChild(filenameLinkElement);

                    var filenameText = document.createTextNode(keys[i]);
                    filenameLinkElement.appendChild(filenameText);
                    filenameElement.appendChild(filenameLinkElement);

                    var sibmeiVersion = _parseMEIDataForDisplay(response);

                    if (sibmeiVersion !== null)
                    {
                        var sibmeiText = document.createTextNode(" (" + sibmeiVersion + ")");
                        filenameElement.appendChild(sibmeiText);
                    }

                    testDiv.appendChild(filenameElement);

                    var statusList = _styleTestStatus(data[keys[i]][0], data[keys[i]][1]);
                    testDiv.appendChild(statusList);

                    var notationDiv = document.createElement('div');
                    var notationHeading = document.createElement('h3');
                    var notationHeadingText = document.createTextNode('Verovio Output');
                    notationHeading.appendChild(notationHeadingText);
                    testDiv.appendChild(notationHeading);

                    notationDiv.innerHTML = svg;
                    testDiv.appendChild(notationDiv);

                    var shouldBeHeading = document.createElement('h3');
                    var shouldBeHeadingText = document.createTextNode('Sibelius Original');
                    shouldBeHeading.appendChild(shouldBeHeadingText);
                    testDiv.appendChild(shouldBeHeading);
                    var shouldBeImg = document.createElement("img");
                    var basename = keys[i].split(".")[0];
                    var imgname = basename + ".png";
                    shouldBeImg.setAttribute('src', '../' + testLocation[0] + "/imgs/" + testLocation[1] + "/" + imgname);
                    testDiv.appendChild(shouldBeImg);
                    outputDiv.appendChild(testDiv);

                    var hrElement = document.createElement("hr");
                    outputDiv.appendChild(hrElement);
                }

                var testLocation = path.split(":");
                fetchTest.open("GET", "../" + testLocation[0] + "/MEI/" + testLocation[1] + "/" + keys[i]);
                fetchTest.send();
            })(i);
        }
    }

    // fetch the tests.
    var tests = new XMLHttpRequest();
    tests.onload = function(args)
    {
        var data = JSON.parse(tests.responseText);
        var testData = _selectTests(path, data);
        _runTests(path, testData);

    }
    tests.open("GET", "../tests.json");
    tests.send();
};