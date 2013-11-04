/*jslint browser: true, nomen: true, unparam: true */
/*globals $, d3, console */

(function () {
    "use strict";

    var margin = {top: 20, right: 120, bottom: 20, left: 120},
        width = 1200 - margin.right - margin.left,
        height = 800 - margin.top - margin.bottom,
        duration = 750,
        root = {name: 'a', x0: height / 2, y0: 0, children: [{name: 'b', children: [{name: 'd'}, {name: 'e'}]}, {name: 'c'}]},
        originalRoot,
        mode = "hide",
        content = "(((laufao:15.51344959,(papuana:11.51059743,(paka:8.864881908,(solomonensis:5.795324181,lanata:5.795324181):3.069557728):2.645715519):4.002852165):16.27358676,(brenneri:27.45841876,(willisiana:9.645259117,(virginalis:7.858127783,gaiboriana:7.858127783):1.787131335):17.81315965):4.328617592):3.92467232,((((((((((((((riopalenquensis:1.768676402,sclerotricha:1.768676402):3.084929757,obscura:4.85360616):2.656397188,((badilloi:3.793588245,necrobracteata:3.793588245):2.071286869,obscuroides:5.864875113):1.645128235):1.465437659,mutisiana:8.975441007):3.770861317,(((oleosa:6.548035617,(lozanoi:5.633856329,(reptans:2.451695404,laxa:2.451695404):3.182160925):0.9141792879):3.905851733,(obscura:8.800770837,dielsiana:8.800770837):1.653116512):0.4432942972,((aristeguietae:6.60535491,maculata:6.60535491):2.707580319,(talamancana:6.753531627,colgantea:6.753531627):2.559403602):1.584246417):1.849120677):1.857164356,(caquetensis:9.46021679,huilensis:9.46021679):5.14324989):1.692274036,(burleana:10.46116895,impudica:10.46116895):5.834571765):1.605928681,sp-1:17.9016694):6.889769275,(((velutina:8.852798257,julianii:8.852798257):1.931359512,lasiorachis:10.78415777):12.02886497,((((villosa:13.10813827,pendula:13.10813827):4.054406957,((((orthotricha:3.604291695,stricta:3.604291695):3.242619971,wagneriana:6.846911666):5.227595917,(aurea:10.01461679,(bihai:7.059436433,rodriguensis:7.059436433):2.955180355):2.059890795):1.867013824,((caribaea:3.620350489,monteverdensis:3.620350489):1.47316999,undulata:5.093520479):8.848000929):3.221023816):1.57256362,hirsuta:18.73510884):3.464842647,(estherae:20.54822763,(meridensis:17.86017359,(((metallica:8.032345916,wilsonii:8.032345916):2.821512061,((mathiasiae:5.876840396,(calatheaphylla:2.802800355,vaginalis:2.802800355):3.074040041):2.978460574,osaensis:8.85530097):1.998557007):3.344101146,golfodulcensis:14.19795912):3.662214464):2.688054043):1.651723859):0.6130712499):1.978415931):1.029363135,((((platystachys:11.42980209,arrecta:11.42980209):5.353194738,((((rhodantha:9.879922287,((nigripraefixa:6.405008919,(terciopela:4.062471974,(atratensis:3.40448611,xanthovillosa:3.40448611):0.6579858644):2.342536944):0.9116160988,donstonea:7.316625017):2.56329727):2.34906187,(stilesii:11.10844099,(mariae:9.03634061,(rigida:7.749583322,longa:7.749583322):1.286757287):2.072100381):1.120543166):1.592795822,(titanum:12.05529381,(curtispatha:9.212463584,((sp-2:5.582144334,regalis:5.582144334):2.273989519,((ramonensis:2.361321555,magnifica:2.361321555):4.318952309,((pogonantha:3.376647608,pogonantha.var.holerythra:3.376647608):1.725626434,danielsiana:5.102274042):1.577999822):1.175859989):1.356329731):2.842830226):1.76648617):1.098048509,((abaloi:7.372712469,pastazae:7.372712469):6.103004862,(griggsiana:11.12288856,((harlingii:5.664629381,(nariniensis:2.898942178,fragilis:2.898942178):2.765687203):2.795645357,fredberryana:8.460274739):2.66261382):2.352828771):1.444111158):1.86316834):3.822192351,(pardoi:19.14798384,((((lingulata:6.724717801,pseudoaemygdiana:6.724717801):3.470376554,(zebrina:7.50910185,gloriosa:7.50910185):2.685992505):4.854155094,(aemygdiana.ssp.aemygdiana:5.90822776,aemygdiana.ssp.transandina:5.90822776):9.141021689):3.469895038,(((plowmaniana:5.070227049,waoraniana:5.070227049):7.910394048,((rostrata:10.43777453,episcopalis:10.43777453):1.59090263,marginata:12.02867716):0.95194394):3.755014517,(penduloides:15.51602614,((vellerigera:12.60466385,((juruana:9.874081324,standleyi:9.874081324):1.20364412,chartacea:11.07772544):1.526938402):1.19794634,spathocircinata:13.80261019):1.713415955):1.219609473):1.783508873):0.6288393566):1.457205336):3.724120124,(longiflora.ssp.ecuadoriensis:12.53139353,(schumanniana:10.45817936,cordata:10.45817936):2.073214174):11.79791577):1.491492503):0.4510985005,((laneana:10.06638042,angusta:10.06638042):11.35132847,((cucullata:2.276549692,farinosa:2.276549692):8.796900643,sampaioana:11.07345034):10.34425855):4.85419142):0.3510067864,(lourteigiae:23.3753202,((dasyantha:11.37806421,richardiana:11.37806421):7.331388695,(((psittacorum:12.61595754,(tarumaensis:10.73115693,(acuminata:7.86181531,brachyantha:7.86181531):2.869341616):1.88480061):2.677234024,sylvestris:15.29319156):1.227759616,densiflora:16.52095118):2.188501724):4.665867302):3.24758689):0.788904372,(((aurantiaca:14.84402627,spissa:14.84402627):4.026204655,schiedeana:18.87023092):4.934566146,(collinsiana:22.1349999,(((secunda:13.40835303,lophocarpa:13.40835303):3.742405863,(imbricata:16.08161566,(((irrasa.ssp.irrasa.var.glabra:1.541844683,irrasa:1.541844683):11.31349362,(ignescens:4.985925537,(gracilis:3.149732576,rodriguezii:3.149732576):1.836192961):7.869412767):2.184864205,((clinophila:12.40271494,(((subulata:8.65576622,(lindsayana:7.111290907,(samperiana:1.951840506,foreroi:1.951840506):5.159450401):1.544475314):2.496724143,(((sp-3:4.328772027,albicosta:4.328772027):1.662877637,(tenebrosa:1.74667389,trichocarpa:1.74667389):4.244975775):4.500827269,(((lankersteri.var.lankersteri:3.587078613,lankersteri.var.rubra:3.587078613):4.322178725,(tortuosa:2.497542189,faunorum:2.497542189):5.411715149):1.413790706,((((chrysocraspeda:3.134213815,beckneri:3.134213815):3.04601285,umbrophila:6.180226665):0.6573321156,latispatha:6.837558781):1.497772623,thomasiana:8.335331404):0.9877166399):1.169428889):0.6600134298):0.8803394752,((bella:3.948802934,nutans:3.948802934):2.726117031,atropurpurea:6.674919965):5.357909873):0.3698851019):1.379167888,reticulata:13.78188283):1.25831968):1.04141315):1.06914323):1.390245795,(librata:10.62762508,bourgaeana:10.62762508):7.913379605):3.593995212):1.669797174):3.607014395):7.362974079,(indica.var.micholitzii:1.556992044,indica.var.dennisiana:1.556992044):33.2177935):0.9369231327);",
        //content = "((((((((ahli:0.1308887296,allogus:0.1308887296):0.109078899,rubribarbus:0.2399676286):0.3477240729,imias:0.5876917015):0.1279779191,((((sagrei:0.2576204042,(bremeri:0.1097436524,quadriocellifer:0.1097436524):0.1478767518):0.06150599843,ophiolepis:0.3191264027):0.08721921759,mestrei:0.4063456203):0.1298140501,(((jubar:0.1188659524,homolechis:0.1188659524):0.09052271908,confusus:0.2093886715):0.04215577182,guafe:0.2515444433):0.2846152271):0.1795099503):0.1377237125,((((garmani:0.2000335809,opalinus:0.2000335809):0.01968719882,grahami:0.2197207797):0.2178099139,valencienni:0.4375306936):0.1226128606,(lineatopus:0.4713710622,reconditus:0.4713710622):0.08877249208):0.2932497789):0.06703519523,(((evermanni:0.2135202715,stratulus:0.2135202715):0.3521520586,(((krugi:0.3267560653,pulchellus:0.3267560653):0.1312930371,(gundlachi:0.3864660126,poncensis:0.3864660126):0.0715830898):0.03035078065,(cooki:0.395288192,cristatellus:0.395288192):0.09311169105):0.07727244709):0.1495575755,(((brevirostris:0.2757423466,(caudalis:0.1704974619,marron:0.1704974619):0.1052448847):0.02672749452,websteri:0.3024698411):0.09835748687,distichus:0.400827328):0.3144025776):0.2051986227):0.03488732303,(((barbouri:0.8021085018,(((alumina:0.2681076879,semilineatus:0.2681076879):0.219367178,olssoni:0.4874748658):0.2622236606,(etheridgei:0.5883072151,(fowleri:0.3770938401,insolitus:0.3770938401):0.211213375):0.1613913113):0.05240997539):0.0672038969,((((whitemani:0.3420271265,((haetianus:0.2669834072,breslini:0.2669834072):0.06962183477,((armouri:0.1483909526,cybotes:0.1483909526):0.04416718222,shrevei:0.1925581348):0.1440471072):0.005421884492):0.1066560095,(longitibialis:0.2521253346,strahmi:0.2521253346):0.1965578014):0.09143002532,marcanoi:0.5401131613):0.2505275207,((((((baleatus:0.04173045424,barahonae:0.04173045424):0.05263675531,ricordii:0.09436720956):0.2036021511,eugenegrahami:0.2979693606):0.0851110199,christophei:0.3830803805):0.09095334022,cuvieri:0.4740337207):0.1076385501,(barbatus:0.1467942669,(porcus:0.09310584235,(chamaeleonides:0.07630236186,guamuhaya:0.07630236186):0.01680348049):0.05368842459):0.4348780039):0.2089684112):0.07867171672):0.07597999248,((((((((altitudinalis:0.1748899419,oporinus:0.1748899419):0.09220318062,isolepis:0.2670931225):0.2538920892,(allisoni:0.29602293,porcatus:0.29602293):0.2249622817):0.03703491197,(((argillaceus:0.1142165228,centralis:0.1142165228):0.0249762444,pumilis:0.1391927672):0.2356256274,loysiana:0.3748183946):0.1832017291):0.08522862529,guazuma:0.6432487489):0.04644117492,((placidus:0.1869579579,sheplani:0.1869579579):0.3773659809,(alayoni:0.3793818065,(angusticeps:0.2172126961,paternus:0.2172126961):0.1621691104):0.1849421323):0.125365985):0.07887044542,((alutaceus:0.120861969,inexpectatus:0.120861969):0.4042515809,(((clivicola:0.3359598029,(cupeyalensis:0.08606303065,cyanopleurus:0.08606303065):0.2498967723):0.1189736423,(alfaroi:0.2802339379,macilentus:0.2802339379):0.1746995073):0.0092278683,vanidicus:0.4641613135):0.06095223642):0.2434468193):0.09435314761,(argenteolus:0.6564331946,lucius:0.6564331946):0.2064803223):0.08237887432):0.01002346021):0.04468414858,(((bartschi:0.5247253674,vermiculatus:0.5247253674):0.249459768,((((baracoae:0.05853977536,(noblei:0.02140617522,smallwoodi:0.02140617522):0.03713360014):0.02849164237,luteogularis:0.08703141773):0.017899207,equestris:0.1049306247):0.6297194497,(((monticola:0.6055537678,(bahorucoensis:0.3841100683,(dolichocephalus:0.1509270933,hendersoni:0.1509270933):0.2331829749):0.2214436996):0.03149201716,darlingtoni:0.637045785):0.03288736013,(((aliniger:0.1783542747,singularis:0.1783542747):0.1377057507,chlorocyanus:0.3160600254):0.2135626601,coelestinus:0.5296226856):0.1403104596):0.0647169293):0.0395350609):0.1207482386,occultus:0.8949333739):0.1050666261);",
        tree = d3.layout.partition()
            .size([height, width])
            .value(function () { return 1; })
            .sort(d3.ascending),
            //.separation(function () { return 1; }),
        diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; }),
        line = d3.svg.line()
            .interpolate("step-before")
            .x(function (d) { return d.y; })
            .y(function (d) { return d.x; }),
        svg = d3.select("body").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("/arborapi/projmgr/project/test?datasetname=anolis&filename=anolis.phy&filetype=newick&data=" + content)
        .send("PUT", null, function (error, data) {
            console.log(data);
            d3.json("/arborapi/projmgr/project/test/PhyloTree/anolis", function (error, collection) {
                var nodeMap = {};
                console.log(collection);
                collection.forEach(function (d, i) {
                    nodeMap[d._id.$oid] = d;
                    d.hasParent = false;
                    if (!d.name) {
                        d.name = "";
                    }
                });
                collection.forEach(function (d) {
                    if (d.clades) {
                        d.children = [];
                        d.clades.forEach(function (clade) {
                            var child = nodeMap[clade.$oid];
                            child.hasParent = true;
                            d.children.push(child);
                        });
                    }
                });
                collection.forEach(function (d) {
                    if (!d.hasParent) {
                        root = d;
                        root.x0 = height / 2;
                        root.y0 = 0;
                    }
                });
                originalRoot = root;
                console.log(root);
                update(root);
                //console.log(nodeMap);
            });
        });

    // Toggle children on click.
    function click(d) {
        if (mode === "hide") {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
        } else if (mode === "focus") {
            root = d;
        } else if (mode === "label") {
            d.showLabel = d.showLabel ? false : true;
        }
        update(d);
    }

    function reset() {
        root = originalRoot;
        function unhideAll(d) {
            if (!d.children) {
                d.children = d._children;
                d._children = null;
            }
            if (d.children) {
                d.children.forEach(unhideAll);
            }
        }
        unhideAll(root);
        update(root);
    }

    function firstChild(d) {
        if (d.children) {
            return firstChild(d.children[0]);
        }
        if (d._children) {
            return firstChild(d._children[0]);
        }
        return d;
    }

    function lastChild(d) {
        if (d.children) {
            return lastChild(d.children[d.children.length - 1]);
        }
        if (d._children) {
            return lastChild(d._children[d._children.length - 1]);
        }
        return d;
    }

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes),
            node,
            nodeEnter,
            nodeUpdate,
            nodeExit,
            link,
            maxY,
            visibleLeaves;

        console.log(nodes);
        console.log(links);

        // Normalize for fixed-depth.
        //nodes.forEach(function(d) { d.y = d.depth * 180; });
        visibleLeaves = 0;
        function setPosition(node, pos) {
            var xSum = 0;
            node.y = pos;
            node.x = node.x + node.dx / 2;
            console.log(pos);
            if (node.children) {
                node.children.forEach(function (d) {
                    setPosition(d, pos + 10 * d.branch_length);
                    xSum += d.x;
                });
                node.x = xSum / node.children.length;
            } else {
                visibleLeaves += 1;
            }
        }
        setPosition(root, 0);

        // Normalize Y to fill space
        maxY = d3.extent(nodes, function (d) { return d.y; })[1];
        nodes.forEach(function (d) {
            d.y = d.y / maxY * (width - 150);
        });

        // Update the nodes…
        node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d._id.$oid; });

        // Enter any new nodes at the parent's previous position.
        nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function() { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", click);

        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("stroke", "none")
            .style("opacity", function(d) { return d._children ? 1 : 0; })
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        nodeEnter.append("text")
            //.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
            .attr("x", 10)
            .attr("dy", ".35em")
            //.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
            .attr("text-anchor", "start")
            .style("font-size", "10px")
            .text(function(d) { return d.name; })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
            .attr("r", 7.5)
            .style("opacity", function(d) { return d._children ? 1 : 0; })
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        nodeUpdate.select("text")
            .text(function (d) {
                if (d._children || (d.children && d.showLabel)) {
                    return firstChild(d).name + " ... " + lastChild(d).name;
                }
                if (visibleLeaves < height / 8) {
                    return d.name;
                }
                return "";
            })
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function() { return "translate(" + source.y + "," + source.x + ")"; })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        link = svg.selectAll("path.link")
            .data(links, function(d) { return d.target._id.$oid; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("fill", "none")
            .attr("d", function() {
                var o = {x: source.x0, y: source.y0};
                //return diagonal({source: o, target: o});
                return line([o, o]);
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            //.attr("d", diagonal);
            .attr("d", function (d) {
                return line([d.source, d.target]);
            });

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function() {
                var o = {x: source.x, y: source.y};
                //return diagonal({source: o, target: o});
                return line([o, o]);
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    d3.select("#mode-hide").on("click", function () {
        mode = "hide";
    });
    d3.select("#mode-focus").on("click", function () {
        mode = "focus";
    });
    d3.select("#mode-label").on("click", function () {
        mode = "label";
    });

    d3.select("#reset").on("click", function () {
        reset();
    });

    d3.select("#pdf").on("click", function () {
        // Prepare for PDF render
        var node = svg.selectAll("g.node").select("circle")
            .attr("r", function (d) { return d._children ? 7.5 : 0; });

        var s = new XMLSerializer();
        var d = d3.select("svg").node();
        var str = s.serializeToString(d);

        // Change back
        node.attr("r", 7.5);

        console.log(str);
        d3.json("svg2pdf").send("POST", str, function (error, data) {
            window.location = "svg2pdf?id=" + data.result;
        });
    });

}());
