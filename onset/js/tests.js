n1 = DataNode(cs[0])
n2 = DataNode(cs[1])
o1 = OperatorNode('AND')
o1.addChild(n1)
e = [];
el.forEach(function(v,o){ e.push(o); })
s1 = SetExpression(o1)
var pl = PixelLayer('#canvas').elements(e).expression(s1).render()