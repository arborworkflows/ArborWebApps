/*jslint browser: true, nomen: true, unparam: true */
/*globals tangelo, $, d3 */

$(function () {
    "use strict";

    var root, vis,
        initialData = [{"branch_length": 0.236764, "_id": {"$oid": "528a40812028ea286a36501b"}, "name": "ahli"}, {"branch_length": 0.099064, "_id": {"$oid": "528a40812028ea286a36501c"}, "name": "allogus"}, {"clades": [{"$oid": "528a40812028ea286a36501b"}, {"$oid": "528a40812028ea286a36501c"}], "branch_length": 0.11757, "_id": {"$oid": "528a40812028ea286a36501d"}}, {"branch_length": 0.136391, "_id": {"$oid": "528a40812028ea286a36501e"}, "name": "rubribarbus"}, {"clades": [{"$oid": "528a40812028ea286a36501d"}, {"$oid": "528a40812028ea286a36501e"}], "branch_length": 0.179612, "_id": {"$oid": "528a40812028ea286a36501f"}}, {"branch_length": 0.226456, "_id": {"$oid": "528a40812028ea286a365020"}, "name": "imias"}, {"clades": [{"$oid": "528a40812028ea286a36501f"}, {"$oid": "528a40812028ea286a365020"}], "branch_length": 0.0616856, "_id": {"$oid": "528a40812028ea286a365021"}}, {"branch_length": 0.0658011, "_id": {"$oid": "528a40812028ea286a365022"}, "name": "sagrei"}, {"branch_length": 0.182485, "_id": {"$oid": "528a40812028ea286a365023"}, "name": "bremeri"}, {"branch_length": 0.0545646, "_id": {"$oid": "528a40812028ea286a365024"}, "name": "quadriocellifer"}, {"clades": [{"$oid": "528a40812028ea286a365023"}, {"$oid": "528a40812028ea286a365024"}], "branch_length": 0.0879857, "_id": {"$oid": "528a40812028ea286a365025"}}, {"clades": [{"$oid": "528a40812028ea286a365022"}, {"$oid": "528a40812028ea286a365025"}], "branch_length": 0.0658011, "_id": {"$oid": "528a40812028ea286a365026"}}, {"branch_length": 0.226839, "_id": {"$oid": "528a40812028ea286a365027"}, "name": "ophiolepis"}, {"clades": [{"$oid": "528a40812028ea286a365026"}, {"$oid": "528a40812028ea286a365027"}], "branch_length": 0.125696, "_id": {"$oid": "528a40812028ea286a365028"}}, {"branch_length": 0.0364252, "_id": {"$oid": "528a40812028ea286a365029"}, "name": "mestrei"}, {"clades": [{"$oid": "528a40812028ea286a365028"}, {"$oid": "528a40812028ea286a365029"}], "branch_length": 0.0598945, "_id": {"$oid": "528a40812028ea286a36502a"}}, {"branch_length": 0.0547369, "_id": {"$oid": "528a40812028ea286a36502b"}, "name": "jubar"}, {"branch_length": 0.0547369, "_id": {"$oid": "528a40812028ea286a36502c"}, "name": "homolechis"}, {"clades": [{"$oid": "528a40812028ea286a36502b"}, {"$oid": "528a40812028ea286a36502c"}], "branch_length": 0.0811121, "_id": {"$oid": "528a40812028ea286a36502d"}}, {"branch_length": 0.0239225, "_id": {"$oid": "528a40812028ea286a36502e"}, "name": "confusus"}, {"clades": [{"$oid": "528a40812028ea286a36502d"}, {"$oid": "528a40812028ea286a36502e"}], "branch_length": 0.135849, "_id": {"$oid": "528a40812028ea286a36502f"}}, {"branch_length": 0.132339, "_id": {"$oid": "528a40812028ea286a365030"}, "name": "guafe"}, {"clades": [{"$oid": "528a40812028ea286a36502f"}, {"$oid": "528a40812028ea286a365030"}], "branch_length": 0.172274, "_id": {"$oid": "528a40812028ea286a365031"}}, {"clades": [{"$oid": "528a40812028ea286a36502a"}, {"$oid": "528a40812028ea286a365031"}], "branch_length": 0.352151, "_id": {"$oid": "528a40812028ea286a365032"}}, {"clades": [{"$oid": "528a40812028ea286a365021"}, {"$oid": "528a40812028ea286a365032"}], "branch_length": 0.00966291, "_id": {"$oid": "528a40812028ea286a365033"}}, {"branch_length": 0.0848066, "_id": {"$oid": "528a40812028ea286a365034"}, "name": "garmani"}, {"branch_length": 0.0621598, "_id": {"$oid": "528a40812028ea286a365035"}, "name": "opalinus"}, {"clades": [{"$oid": "528a40812028ea286a365034"}, {"$oid": "528a40812028ea286a365035"}], "branch_length": 0.0594889, "_id": {"$oid": "528a40812028ea286a365036"}}, {"branch_length": 0.133003, "_id": {"$oid": "528a40812028ea286a365037"}, "name": "grahami"}, {"clades": [{"$oid": "528a40812028ea286a365036"}, {"$oid": "528a40812028ea286a365037"}], "branch_length": 0.0594889, "_id": {"$oid": "528a40812028ea286a365038"}}, {"branch_length": 0.247214, "_id": {"$oid": "528a40812028ea286a365039"}, "name": "valencienni"}, {"clades": [{"$oid": "528a40812028ea286a365038"}, {"$oid": "528a40812028ea286a365039"}], "branch_length": 0.108417, "_id": {"$oid": "528a40812028ea286a36503a"}}, {"branch_length": 0.114211, "_id": {"$oid": "528a40812028ea286a36503b"}, "name": "lineatopus"}, {"branch_length": 0.103208, "_id": {"$oid": "528a40812028ea286a36503c"}, "name": "reconditus"}, {"clades": [{"$oid": "528a40812028ea286a36503b"}, {"$oid": "528a40812028ea286a36503c"}], "branch_length": 0.0110035, "_id": {"$oid": "528a40812028ea286a36503d"}}, {"clades": [{"$oid": "528a40812028ea286a36503a"}, {"$oid": "528a40812028ea286a36503d"}], "branch_length": 0.0489279, "_id": {"$oid": "528a40812028ea286a36503e"}}, {"clades": [{"$oid": "528a40812028ea286a365033"}, {"$oid": "528a40812028ea286a36503e"}], "branch_length": 0.033328, "_id": {"$oid": "528a40812028ea286a36503f"}}, {"branch_length": 0.114831, "_id": {"$oid": "528a40812028ea286a365040"}, "name": "evermanni"}, {"branch_length": 0.227577, "_id": {"$oid": "528a40812028ea286a365041"}, "name": "stratulus"}, {"clades": [{"$oid": "528a40812028ea286a365040"}, {"$oid": "528a40812028ea286a365041"}], "branch_length": 0.269861, "_id": {"$oid": "528a40812028ea286a365042"}}, {"branch_length": 0.110728, "_id": {"$oid": "528a40812028ea286a365043"}, "name": "krugi"}, {"branch_length": 0.0205939, "_id": {"$oid": "528a40812028ea286a365044"}, "name": "pulchellus"}, {"clades": [{"$oid": "528a40812028ea286a365043"}, {"$oid": "528a40812028ea286a365044"}], "branch_length": 0.110728, "_id": {"$oid": "528a40812028ea286a365045"}}, {"branch_length": 0.0839697, "_id": {"$oid": "528a40812028ea286a365046"}, "name": "gundlachi"}, {"branch_length": 0.0467863, "_id": {"$oid": "528a40812028ea286a365047"}, "name": "poncensis"}, {"clades": [{"$oid": "528a40812028ea286a365046"}, {"$oid": "528a40812028ea286a365047"}], "branch_length": 0.0617465, "_id": {"$oid": "528a40812028ea286a365048"}}, {"clades": [{"$oid": "528a40812028ea286a365045"}, {"$oid": "528a40812028ea286a365048"}], "branch_length": 0.0545561, "_id": {"$oid": "528a40812028ea286a365049"}}, {"branch_length": 0.176908, "_id": {"$oid": "528a40812028ea286a36504a"}, "name": "cooki"}, {"branch_length": 0.214092, "_id": {"$oid": "528a40812028ea286a36504b"}, "name": "cristatellus"}, {"clades": [{"$oid": "528a40812028ea286a36504a"}, {"$oid": "528a40812028ea286a36504b"}], "branch_length": 0.176908, "_id": {"$oid": "528a40812028ea286a36504c"}}, {"clades": [{"$oid": "528a40812028ea286a365049"}, {"$oid": "528a40812028ea286a36504c"}], "branch_length": 0.2253, "_id": {"$oid": "528a40812028ea286a36504d"}}, {"clades": [{"$oid": "528a40812028ea286a365042"}, {"$oid": "528a40812028ea286a36504d"}], "branch_length": 0.269861, "_id": {"$oid": "528a40812028ea286a36504e"}}, {"branch_length": 0.0610352, "_id": {"$oid": "528a40812028ea286a36504f"}, "name": "brevirostris"}, {"branch_length": 0.0158357, "_id": {"$oid": "528a40812028ea286a365050"}, "name": "caudalis"}, {"branch_length": 0.162246, "_id": {"$oid": "528a40812028ea286a365051"}, "name": "marron"}, {"clades": [{"$oid": "528a40812028ea286a365050"}, {"$oid": "528a40812028ea286a365051"}], "branch_length": 0.223281, "_id": {"$oid": "528a40812028ea286a365052"}}, {"clades": [{"$oid": "528a40812028ea286a36504f"}, {"$oid": "528a40812028ea286a365052"}], "branch_length": 0.219725, "_id": {"$oid": "528a40812028ea286a365053"}}, {"branch_length": 0.14641, "_id": {"$oid": "528a40812028ea286a365054"}, "name": "websteri"}, {"clades": [{"$oid": "528a40812028ea286a365053"}, {"$oid": "528a40812028ea286a365054"}], "branch_length": 0.219725, "_id": {"$oid": "528a40812028ea286a365055"}}, {"branch_length": 0.0594144, "_id": {"$oid": "528a40812028ea286a365056"}, "name": "distichus"}, {"clades": [{"$oid": "528a40812028ea286a365055"}, {"$oid": "528a40812028ea286a365056"}], "branch_length": 0.214092, "_id": {"$oid": "528a40812028ea286a365057"}}, {"clades": [{"$oid": "528a40812028ea286a36504e"}, {"$oid": "528a40812028ea286a365057"}], "branch_length": 0.103208, "_id": {"$oid": "528a40812028ea286a365058"}}, {"clades": [{"$oid": "528a40812028ea286a36503f"}, {"$oid": "528a40812028ea286a365058"}], "branch_length": 0.101106, "_id": {"$oid": "528a40812028ea286a365059"}}, {"branch_length": 0.0767748, "_id": {"$oid": "528a40812028ea286a36505a"}, "name": "barbouri"}, {"branch_length": 0.0444409, "_id": {"$oid": "528a40812028ea286a36505b"}, "name": "alumina"}, {"branch_length": 0.198328, "_id": {"$oid": "528a40812028ea286a36505c"}, "name": "semilineatus"}, {"clades": [{"$oid": "528a40812028ea286a36505b"}, {"$oid": "528a40812028ea286a36505c"}], "branch_length": 0.523606, "_id": {"$oid": "528a40812028ea286a36505d"}}, {"branch_length": 0.126559, "_id": {"$oid": "528a40812028ea286a36505e"}, "name": "olssoni"}, {"clades": [{"$oid": "528a40812028ea286a36505d"}, {"$oid": "528a40812028ea286a36505e"}], "branch_length": 0.0694246, "_id": {"$oid": "528a40812028ea286a36505f"}}, {"branch_length": 0.280837, "_id": {"$oid": "528a40812028ea286a365060"}, "name": "etheridgei"}, {"branch_length": 0.141944, "_id": {"$oid": "528a40812028ea286a365061"}, "name": "fowleri"}, {"branch_length": 0.352606, "_id": {"$oid": "528a40812028ea286a365062"}, "name": "insolitus"}, {"clades": [{"$oid": "528a40812028ea286a365061"}, {"$oid": "528a40812028ea286a365062"}], "branch_length": 0.141944, "_id": {"$oid": "528a40812028ea286a365063"}}, {"clades": [{"$oid": "528a40812028ea286a365060"}, {"$oid": "528a40812028ea286a365063"}], "branch_length": 0.138894, "_id": {"$oid": "528a40812028ea286a365064"}}, {"clades": [{"$oid": "528a40812028ea286a36505f"}, {"$oid": "528a40812028ea286a365064"}], "branch_length": 0.0595533, "_id": {"$oid": "528a40812028ea286a365065"}}, {"clades": [{"$oid": "528a40812028ea286a36505a"}, {"$oid": "528a40812028ea286a365065"}], "branch_length": 0.0709765, "_id": {"$oid": "528a40812028ea286a365066"}}, {"branch_length": 0.166017, "_id": {"$oid": "528a40812028ea286a365067"}, "name": "whitemani"}, {"branch_length": 0.0683522, "_id": {"$oid": "528a40812028ea286a365068"}, "name": "haetianus"}, {"branch_length": 0.121942, "_id": {"$oid": "528a40812028ea286a365069"}, "name": "breslini"}, {"clades": [{"$oid": "528a40812028ea286a365068"}, {"$oid": "528a40812028ea286a365069"}], "branch_length": 0.317638, "_id": {"$oid": "528a40812028ea286a36506a"}}, {"branch_length": 0.0416421, "_id": {"$oid": "528a40812028ea286a36506b"}, "name": "armouri"}, {"branch_length": 0.0838584, "_id": {"$oid": "528a40812028ea286a36506c"}, "name": "cybotes"}, {"clades": [{"$oid": "528a40812028ea286a36506b"}, {"$oid": "528a40812028ea286a36506c"}], "branch_length": 0.00333347, "_id": {"$oid": "528a40812028ea286a36506d"}}, {"branch_length": 0.141287, "_id": {"$oid": "528a40812028ea286a36506e"}, "name": "shrevei"}, {"clades": [{"$oid": "528a40812028ea286a36506d"}, {"$oid": "528a40812028ea286a36506e"}], "branch_length": 0.186263, "_id": {"$oid": "528a40812028ea286a36506f"}}, {"clades": [{"$oid": "528a40812028ea286a36506a"}, {"$oid": "528a40812028ea286a36506f"}], "branch_length": 0.0630227, "_id": {"$oid": "528a40812028ea286a365070"}}, {"clades": [{"$oid": "528a40812028ea286a365067"}, {"$oid": "528a40812028ea286a365070"}], "branch_length": 0.196097, "_id": {"$oid": "528a40812028ea286a365071"}}, {"branch_length": 0.0239808, "_id": {"$oid": "528a40812028ea286a365072"}, "name": "longitibialis"}, {"branch_length": 0.0990711, "_id": {"$oid": "528a40812028ea286a365073"}, "name": "strahmi"}, {"clades": [{"$oid": "528a40812028ea286a365072"}, {"$oid": "528a40812028ea286a365073"}], "branch_length": 0.141287, "_id": {"$oid": "528a40812028ea286a365074"}}, {"clades": [{"$oid": "528a40812028ea286a365071"}, {"$oid": "528a40812028ea286a365074"}], "branch_length": 0.208147, "_id": {"$oid": "528a40812028ea286a365075"}}, {"branch_length": 0.0750903, "_id": {"$oid": "528a40812028ea286a365076"}, "name": "marcanoi"}, {"clades": [{"$oid": "528a40812028ea286a365075"}, {"$oid": "528a40812028ea286a365076"}], "branch_length": 0.208147, "_id": {"$oid": "528a40812028ea286a365077"}}, {"branch_length": 0.271667, "_id": {"$oid": "528a40812028ea286a365078"}, "name": "baleatus"}, {"branch_length": 0.0523818, "_id": {"$oid": "528a40812028ea286a365079"}, "name": "barahonae"}, {"clades": [{"$oid": "528a40812028ea286a365078"}, {"$oid": "528a40812028ea286a365079"}], "branch_length": 0.059727, "_id": {"$oid": "528a40812028ea286a36507a"}}, {"branch_length": 0.211939, "_id": {"$oid": "528a40812028ea286a36507b"}, "name": "ricordii"}, {"clades": [{"$oid": "528a40812028ea286a36507a"}, {"$oid": "528a40812028ea286a36507b"}], "branch_length": 0.27348, "_id": {"$oid": "528a40812028ea286a36507c"}}, {"branch_length": 0.112759, "_id": {"$oid": "528a40812028ea286a36507d"}, "name": "eugenegrahami"}, {"clades": [{"$oid": "528a40812028ea286a36507c"}, {"$oid": "528a40812028ea286a36507d"}], "branch_length": 0.0760514, "_id": {"$oid": "528a40812028ea286a36507e"}}, {"branch_length": 0.159558, "_id": {"$oid": "528a40812028ea286a36507f"}, "name": "christophei"}, {"clades": [{"$oid": "528a40812028ea286a36507e"}, {"$oid": "528a40812028ea286a36507f"}], "branch_length": 0.132674, "_id": {"$oid": "528a40812028ea286a365080"}}, {"branch_length": 0.0265041, "_id": {"$oid": "528a40812028ea286a365081"}, "name": "cuvieri"}, {"clades": [{"$oid": "528a40812028ea286a365080"}, {"$oid": "528a40812028ea286a365081"}], "branch_length": 0.132674, "_id": {"$oid": "528a40812028ea286a365082"}}, {"branch_length": 0.0202942, "_id": {"$oid": "528a40812028ea286a365083"}, "name": "barbatus"}, {"branch_length": 0.0742378, "_id": {"$oid": "528a40812028ea286a365084"}, "name": "porcus"}, {"branch_length": 0.0461513, "_id": {"$oid": "528a40812028ea286a365085"}, "name": "chamaeleonides"}, {"branch_length": 0.00856467, "_id": {"$oid": "528a40812028ea286a365086"}, "name": "guamuhaya"}, {"clades": [{"$oid": "528a40812028ea286a365085"}, {"$oid": "528a40812028ea286a365086"}], "branch_length": 0.0280864, "_id": {"$oid": "528a40812028ea286a365087"}}, {"clades": [{"$oid": "528a40812028ea286a365084"}, {"$oid": "528a40812028ea286a365087"}], "branch_length": 0.0202942, "_id": {"$oid": "528a40812028ea286a365088"}}, {"clades": [{"$oid": "528a40812028ea286a365083"}, {"$oid": "528a40812028ea286a365088"}], "branch_length": 0.0467984, "_id": {"$oid": "528a40812028ea286a365089"}}, {"clades": [{"$oid": "528a40812028ea286a365082"}, {"$oid": "528a40812028ea286a365089"}], "branch_length": 0.0750903, "_id": {"$oid": "528a40812028ea286a36508a"}}, {"clades": [{"$oid": "528a40812028ea286a365077"}, {"$oid": "528a40812028ea286a36508a"}], "branch_length": 0.144459, "_id": {"$oid": "528a40812028ea286a36508b"}}, {"clades": [{"$oid": "528a40812028ea286a365066"}, {"$oid": "528a40812028ea286a36508b"}], "branch_length": 0.0869955, "_id": {"$oid": "528a40812028ea286a36508c"}}, {"branch_length": 0.0635266, "_id": {"$oid": "528a40812028ea286a36508d"}, "name": "altitudinalis"}, {"branch_length": 0.394013, "_id": {"$oid": "528a40812028ea286a36508e"}, "name": "oporinus"}, {"clades": [{"$oid": "528a40812028ea286a36508d"}, {"$oid": "528a40812028ea286a36508e"}], "branch_length": 0.0952937, "_id": {"$oid": "528a40812028ea286a36508f"}}, {"branch_length": 0.0263861, "_id": {"$oid": "528a40812028ea286a365090"}, "name": "isolepis"}, {"clades": [{"$oid": "528a40812028ea286a36508f"}, {"$oid": "528a40812028ea286a365090"}], "branch_length": 0.0363305, "_id": {"$oid": "528a40812028ea286a365091"}}, {"branch_length": 0.162748, "_id": {"$oid": "528a40812028ea286a365092"}, "name": "allisoni"}, {"branch_length": 0.145702, "_id": {"$oid": "528a40812028ea286a365093"}, "name": "porcatus"}, {"clades": [{"$oid": "528a40812028ea286a365092"}, {"$oid": "528a40812028ea286a365093"}], "branch_length": 0.123777, "_id": {"$oid": "528a40812028ea286a365094"}}, {"clades": [{"$oid": "528a40812028ea286a365091"}, {"$oid": "528a40812028ea286a365094"}], "branch_length": 0.187956, "_id": {"$oid": "528a40812028ea286a365095"}}, {"branch_length": 0.0893845, "_id": {"$oid": "528a40812028ea286a365096"}, "name": "argillaceus"}, {"branch_length": 0.158398, "_id": {"$oid": "528a40812028ea286a365097"}, "name": "centralis"}, {"clades": [{"$oid": "528a40812028ea286a365096"}, {"$oid": "528a40812028ea286a365097"}], "branch_length": 0.0893845, "_id": {"$oid": "528a40812028ea286a365098"}}, {"branch_length": 0.158398, "_id": {"$oid": "528a40812028ea286a365099"}, "name": "pumilis"}, {"clades": [{"$oid": "528a40812028ea286a365098"}, {"$oid": "528a40812028ea286a365099"}], "branch_length": 0.141352, "_id": {"$oid": "528a40812028ea286a36509a"}}, {"branch_length": 0.136516, "_id": {"$oid": "528a40812028ea286a36509b"}, "name": "loysiana"}, {"clades": [{"$oid": "528a40812028ea286a36509a"}, {"$oid": "528a40812028ea286a36509b"}], "branch_length": 0.0519672, "_id": {"$oid": "528a40812028ea286a36509c"}}, {"clades": [{"$oid": "528a40812028ea286a365095"}, {"$oid": "528a40812028ea286a36509c"}], "branch_length": 0.0646185, "_id": {"$oid": "528a40812028ea286a36509d"}}, {"branch_length": 0.206709, "_id": {"$oid": "528a40812028ea286a36509e"}, "name": "guazuma"}, {"clades": [{"$oid": "528a40812028ea286a36509d"}, {"$oid": "528a40812028ea286a36509e"}], "branch_length": 0.17316, "_id": {"$oid": "528a40812028ea286a36509f"}}, {"branch_length": 0.0570631, "_id": {"$oid": "528a40812028ea286a3650a0"}, "name": "placidus"}, {"branch_length": 0.0570631, "_id": {"$oid": "528a40812028ea286a3650a1"}, "name": "sheplani"}, {"clades": [{"$oid": "528a40812028ea286a3650a0"}, {"$oid": "528a40812028ea286a3650a1"}], "branch_length": 0.0701935, "_id": {"$oid": "528a40812028ea286a3650a2"}}, {"branch_length": 0.125455, "_id": {"$oid": "528a40812028ea286a3650a3"}, "name": "alayoni"}, {"branch_length": 0.0959873, "_id": {"$oid": "528a40812028ea286a3650a4"}, "name": "angusticeps"}, {"branch_length": 0.209594, "_id": {"$oid": "528a40812028ea286a3650a5"}, "name": "paternus"}, {"clades": [{"$oid": "528a40812028ea286a3650a4"}, {"$oid": "528a40812028ea286a3650a5"}], "branch_length": 0.0959873, "_id": {"$oid": "528a40812028ea286a3650a6"}}, {"clades": [{"$oid": "528a40812028ea286a3650a3"}, {"$oid": "528a40812028ea286a3650a6"}], "branch_length": 0.239062, "_id": {"$oid": "528a40812028ea286a3650a7"}}, {"clades": [{"$oid": "528a40812028ea286a3650a2"}, {"$oid": "528a40812028ea286a3650a7"}], "branch_length": 0.0131305, "_id": {"$oid": "528a40812028ea286a3650a8"}}, {"clades": [{"$oid": "528a40812028ea286a36509f"}, {"$oid": "528a40812028ea286a3650a8"}], "branch_length": 0.0823991, "_id": {"$oid": "528a40812028ea286a3650a9"}}, {"branch_length": 0.112801, "_id": {"$oid": "528a40812028ea286a3650aa"}, "name": "alutaceus"}, {"branch_length": 0.246473, "_id": {"$oid": "528a40812028ea286a3650ab"}, "name": "inexpectatus"}, {"clades": [{"$oid": "528a40812028ea286a3650aa"}, {"$oid": "528a40812028ea286a3650ab"}], "branch_length": 0.112801, "_id": {"$oid": "528a40812028ea286a3650ac"}}, {"branch_length": 0.00619856, "_id": {"$oid": "528a40812028ea286a3650ad"}, "name": "clivicola"}, {"branch_length": 0.0762564, "_id": {"$oid": "528a40812028ea286a3650ae"}, "name": "cupeyalensis"}, {"branch_length": 0.109741, "_id": {"$oid": "528a40812028ea286a3650af"}, "name": "cyanopleurus"}, {"clades": [{"$oid": "528a40812028ea286a3650ae"}, {"$oid": "528a40812028ea286a3650af"}], "branch_length": 0.264988, "_id": {"$oid": "528a40812028ea286a3650b0"}}, {"clades": [{"$oid": "528a40812028ea286a3650ad"}, {"$oid": "528a40812028ea286a3650b0"}], "branch_length": 0.060533, "_id": {"$oid": "528a40812028ea286a3650b1"}}, {"branch_length": 0.139985, "_id": {"$oid": "528a40812028ea286a3650b2"}, "name": "alfaroi"}, {"branch_length": 0.0425485, "_id": {"$oid": "528a40812028ea286a3650b3"}, "name": "macilentus"}, {"clades": [{"$oid": "528a40812028ea286a3650b2"}, {"$oid": "528a40812028ea286a3650b3"}], "branch_length": 0.182534, "_id": {"$oid": "528a40812028ea286a3650b4"}}, {"clades": [{"$oid": "528a40812028ea286a3650b1"}, {"$oid": "528a40812028ea286a3650b4"}], "branch_length": 0.060533, "_id": {"$oid": "528a40812028ea286a3650b5"}}, {"branch_length": 0.0425485, "_id": {"$oid": "528a40812028ea286a3650b6"}, "name": "vanidicus"}, {"clades": [{"$oid": "528a40812028ea286a3650b5"}, {"$oid": "528a40812028ea286a3650b6"}], "branch_length": 0.0420172, "_id": {"$oid": "528a40812028ea286a3650b7"}}, {"clades": [{"$oid": "528a40812028ea286a3650ac"}, {"$oid": "528a40812028ea286a3650b7"}], "branch_length": 0.0967935, "_id": {"$oid": "528a40812028ea286a3650b8"}}, {"clades": [{"$oid": "528a40812028ea286a3650a9"}, {"$oid": "528a40812028ea286a3650b8"}], "branch_length": 0.0375862, "_id": {"$oid": "528a40812028ea286a3650b9"}}, {"branch_length": 0.14905, "_id": {"$oid": "528a40812028ea286a3650ba"}, "name": "argenteolus"}, {"branch_length": 0.404201, "_id": {"$oid": "528a40812028ea286a3650bb"}, "name": "lucius"}, {"clades": [{"$oid": "528a40812028ea286a3650ba"}, {"$oid": "528a40812028ea286a3650bb"}], "branch_length": 0.14905, "_id": {"$oid": "528a40812028ea286a3650bc"}}, {"clades": [{"$oid": "528a40812028ea286a3650b9"}, {"$oid": "528a40812028ea286a3650bc"}], "branch_length": 0.0375862, "_id": {"$oid": "528a40812028ea286a3650bd"}}, {"clades": [{"$oid": "528a40812028ea286a36508c"}, {"$oid": "528a40812028ea286a3650bd"}], "branch_length": 0.0869955, "_id": {"$oid": "528a40812028ea286a3650be"}}, {"clades": [{"$oid": "528a40812028ea286a365059"}, {"$oid": "528a40812028ea286a3650be"}], "branch_length": 0.0439569, "_id": {"$oid": "528a40812028ea286a3650bf"}}, {"branch_length": 0.192983, "_id": {"$oid": "528a40812028ea286a3650c0"}, "name": "bartschi"}, {"branch_length": 0.0329965, "_id": {"$oid": "528a40812028ea286a3650c1"}, "name": "vermiculatus"}, {"clades": [{"$oid": "528a40812028ea286a3650c0"}, {"$oid": "528a40812028ea286a3650c1"}], "branch_length": 0.60665, "_id": {"$oid": "528a40812028ea286a3650c2"}}, {"branch_length": 0.00919938, "_id": {"$oid": "528a40812028ea286a3650c3"}, "name": "baracoae"}, {"branch_length": 0.014396, "_id": {"$oid": "528a40812028ea286a3650c4"}, "name": "noblei"}, {"branch_length": 0.0430426, "_id": {"$oid": "528a40812028ea286a3650c5"}, "name": "smallwoodi"}, {"clades": [{"$oid": "528a40812028ea286a3650c4"}, {"$oid": "528a40812028ea286a3650c5"}], "branch_length": 0.0522425, "_id": {"$oid": "528a40812028ea286a3650c6"}}, {"clades": [{"$oid": "528a40812028ea286a3650c3"}, {"$oid": "528a40812028ea286a3650c6"}], "branch_length": 0.0519832, "_id": {"$oid": "528a40812028ea286a3650c7"}}, {"branch_length": 0.0286471, "_id": {"$oid": "528a40812028ea286a3650c8"}, "name": "luteogularis"}, {"clades": [{"$oid": "528a40812028ea286a3650c7"}, {"$oid": "528a40812028ea286a3650c8"}], "branch_length": 0.414476, "_id": {"$oid": "528a40812028ea286a3650c9"}}, {"branch_length": 0.0183148, "_id": {"$oid": "528a40812028ea286a3650ca"}, "name": "equestris"}, {"clades": [{"$oid": "528a40812028ea286a3650c9"}, {"$oid": "528a40812028ea286a3650ca"}], "branch_length": 0.306732, "_id": {"$oid": "528a40812028ea286a3650cb"}}, {"branch_length": 0.104545, "_id": {"$oid": "528a40812028ea286a3650cc"}, "name": "monticola"}, {"branch_length": 0.389253, "_id": {"$oid": "528a40812028ea286a3650cd"}, "name": "bahorucoensis"}, {"branch_length": 0.15283, "_id": {"$oid": "528a40812028ea286a3650ce"}, "name": "dolichocephalus"}, {"branch_length": 0.212593, "_id": {"$oid": "528a40812028ea286a3650cf"}, "name": "hendersoni"}, {"clades": [{"$oid": "528a40812028ea286a3650ce"}, {"$oid": "528a40812028ea286a3650cf"}], "branch_length": 0.365424, "_id": {"$oid": "528a40812028ea286a3650d0"}}, {"clades": [{"$oid": "528a40812028ea286a3650cd"}, {"$oid": "528a40812028ea286a3650d0"}], "branch_length": 0.0238295, "_id": {"$oid": "528a40812028ea286a3650d1"}}, {"clades": [{"$oid": "528a40812028ea286a3650cc"}, {"$oid": "528a40812028ea286a3650d1"}], "branch_length": 0.025482, "_id": {"$oid": "528a40812028ea286a3650d2"}}, {"branch_length": 0.136147, "_id": {"$oid": "528a40812028ea286a3650d3"}, "name": "darlingtoni"}, {"clades": [{"$oid": "528a40812028ea286a3650d2"}, {"$oid": "528a40812028ea286a3650d3"}], "branch_length": 0.0103323, "_id": {"$oid": "528a40812028ea286a3650d4"}}, {"branch_length": 0.31019, "_id": {"$oid": "528a40812028ea286a3650d5"}, "name": "aliniger"}, {"branch_length": 0.0791448, "_id": {"$oid": "528a40812028ea286a3650d6"}, "name": "singularis"}, {"clades": [{"$oid": "528a40812028ea286a3650d5"}, {"$oid": "528a40812028ea286a3650d6"}], "branch_length": 0.139771, "_id": {"$oid": "528a40812028ea286a3650d7"}}, {"branch_length": 0.170418, "_id": {"$oid": "528a40812028ea286a3650d8"}, "name": "chlorocyanus"}, {"clades": [{"$oid": "528a40812028ea286a3650d7"}, {"$oid": "528a40812028ea286a3650d8"}], "branch_length": 0.0764462, "_id": {"$oid": "528a40812028ea286a3650d9"}}, {"branch_length": 0.0912737, "_id": {"$oid": "528a40812028ea286a3650da"}, "name": "coelestinus"}, {"clades": [{"$oid": "528a40812028ea286a3650d9"}, {"$oid": "528a40812028ea286a3650da"}], "branch_length": 0.0764462, "_id": {"$oid": "528a40812028ea286a3650db"}}, {"clades": [{"$oid": "528a40812028ea286a3650d4"}, {"$oid": "528a40812028ea286a3650db"}], "branch_length": 0.0103323, "_id": {"$oid": "528a40812028ea286a3650dc"}}, {"clades": [{"$oid": "528a40812028ea286a3650cb"}, {"$oid": "528a40812028ea286a3650dc"}], "branch_length": 0.306732, "_id": {"$oid": "528a40812028ea286a3650dd"}}, {"clades": [{"$oid": "528a40812028ea286a3650c2"}, {"$oid": "528a40812028ea286a3650dd"}], "branch_length": 0.106935, "_id": {"$oid": "528a40812028ea286a3650de"}}, {"branch_length": 0.0912737, "_id": {"$oid": "528a40812028ea286a3650df"}, "name": "occultus"}, {"clades": [{"$oid": "528a40812028ea286a3650de"}, {"$oid": "528a40812028ea286a3650df"}], "branch_length": 0.404201, "_id": {"$oid": "528a40812028ea286a3650e0"}}, {"clades": [{"$oid": "528a40812028ea286a3650bf"}, {"$oid": "528a40812028ea286a3650e0"}], "_id": {"$oid": "528a40812028ea286a3650e1"}}, {"clades": [{"$oid": "528a40812028ea286a3650e1"}], "branch_length": 1.0, "_id": {"$oid": "528a40812028ea286a3650e2"}}, {"clades": [{"$oid": "528a40812028ea286a3650e2"}], "_id": {"$oid": "528a40812028ea286a3650e3"}, "rooted": true, "weight": 1.0}],
        filtered = [];

    // Get rid of "handle" node
    initialData.forEach(function (d) {
        if (!d.rooted) {
            filtered.push(d);
        }
    });

    root = tangelo.data.tree({
        data: filtered,
        id: {field: "_id.$oid"},
        idChild: {field: "$oid"},
        children: {field: "clades"}
    });

    vis = $("#vis").dendrogram({
        data: root,
        id: {field: "_id.$oid"},
        label: {field: "name"},
        distance: {field: "branch_length"},
        nodeLimit: 1000
    });

    d3.select("#mode-hide").on("click", function () {
        vis.dendrogram({mode: "hide"});
    });

    d3.select("#mode-focus").on("click", function () {
        vis.dendrogram({mode: "focus"});
    });

    d3.select("#mode-label").on("click", function () {
        vis.dendrogram({mode: "label"});
    });

    d3.select("#distance-unit").on("click", function () {
        vis.dendrogram({distance: {value: 1}});
    });

    d3.select("#distance-branch-length").on("click", function () {
        vis.dendrogram({distance: {field: "branch_length"}});
    });

    d3.select("#node-limit-500").on("click", function () {
        vis.dendrogram({nodeLimit: 500});
    });

    d3.select("#node-limit-1000").on("click", function () {
        vis.dendrogram({nodeLimit: 1000});
    });

    d3.select("#node-limit-2000").on("click", function () {
        vis.dendrogram({nodeLimit: 2000});
    });

    d3.select("#reset").on("click", function () {
        vis.reset();
    });

    d3.select("#pdf").on("click", function () {
        vis.download("pdf");
    });

    d3.select("#upload").on("click", function () {
        var reader = new window.FileReader(),
            file = d3.select("#file").node().files[0];

        reader.onload = function (e) {
            var project = d3.select("#project").node(),
                projectName = project.options[project.selectedIndex].text,
                dataName = file.name,
                content = e.target.result;

            d3.json("/arborapi/projmgr/project/" + projectName + "?filename=" + dataName + "&filetype=newick&datasetname=" + dataName + "&data=" + content)
                .send("put", content, function (error, data) {
                    initializeDataSelection(projectName, dataName);
                });
        };
        reader.readAsText(file);
    });

    function performEvent(element, name) {
        if (document.createEvent !== undefined) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent(name, false, true);
            element.dispatchEvent(evt);
        } else {
            element.fireEvent("on" + name);
        }
    }

    function initializeDataSelection(initialProject, initialData) {
        var project = d3.select("#project").node(),
            data = d3.select("#data").node(),
            i;

        d3.json("/arborapi/projmgr/project", function (error, projects) {
            d3.select("#project").selectAll("option").remove();
            d3.select("#project").selectAll("option")
                .data(projects)
                .enter().append("option")
                .text(function (d) { return d; });
            d3.select("#project").on("change", function () {
                var project = d3.select("#project").node(),
                    projectName = project.options[project.selectedIndex].text;
                d3.json("/arborapi/projmgr/project/" + projectName + "/PhyloTree", function (error, datasets) {
                    d3.select("#data").selectAll("option").remove();
                    d3.select("#data").selectAll("option")
                        .data(datasets)
                        .enter().append("option")
                        .text(function (d) { return d; });
                    d3.select("#data").on("change", function () {
                        var projectName = project.options[project.selectedIndex].text,
                            dataName = data.options[data.selectedIndex].text;
                        d3.json("/arborapi/projmgr/project/" + projectName + "/PhyloTree/" + dataName, function (error, collection) {
                            var filtered = [];

                            // Get rid of "handle" node
                            collection.forEach(function (d) {
                                if (!d.rooted) {
                                    filtered.push(d);
                                }
                            });

                            root = tangelo.data.tree({
                                data: filtered,
                                id: {field: "_id.$oid"},
                                idChild: {field: "$oid"},
                                children: {field: "clades"}
                            });

                            vis.dendrogram({data: root});
                        });
                    });
                    for (i = 0; i < data.options.length; i += 1) {
                        if (data.options[i].text === initialData) {
                            data.selectedIndex = i;
                        }
                    }
                    performEvent(data, "change");
                });
            });
            for (i = 0; i < project.options.length; i += 1) {
                if (project.options[i].text === initialProject) {
                    project.selectedIndex = i;
                }
            }
            performEvent(project, "change");
        });
    }

    //initializeDataSelection("other");

});
