// display a OneZoom phylotree
function onezoom_tree(selected_tree) {
  d3.text("/arborapi/projmgr/project/" + project + "/PhyloTree/" + selected_tree+ "/newick", function (error, newickString) {
    onezoom_init(newickString);
  });
}

function userdata(inputTreeNewickString)
{
	// edit this line to change the default data
	fulltree = new midnode(inputTreeNewickString);
}

// default viewing options (can be changed with buttons when running)
var polytype = 3; // the way polytomies are expressed (should be 0,1,2 or 3)
var viewtype = 2; // the default viewtype (should be 1,2,3,4 or 5)
var colourtype = 3; // the default colour mode - note: if doing further editing of colour palette's below this may become irrelevant
// colourtype = 3 is only suited for redlist data
var leaftype = 2; // leaf shape circular or natural - this cannpt be changed with buttons it is recommended you leave it

var fonttype = 'Helvetica'; // change the text font to match the rest of your article and journal style // 'sans-serif' // is good too
var intnodetextcolor = 'rgb(255,255,255)' // for interior node text colour where there is a name to be put
// note there are more advanced options later to change th interior node text
var backgroundcolor = 'rgb(255,255,200)' //background color 'null' if no background is wanted
var outlineboxcolor = 'rgb(0,0,0)' // outline box colour

// colour codes for redlist
function redlistcolor(codein)
{
	switch(codein)
	{
		case "EX":
		return ('rgb(0,0,180)');
		case "EW":
		return ('rgb(60,50,135)');
		case "CR":
		return ('rgb(220,0,0)');
		case "EN":
		return ('rgb(125,30,00)');
		case "VU":
		return ('rgb(85,85,30)');
		case "NT":
		return ('rgb(65,120,0)');
		case "LC":
		return ('rgb(0,220,0)');
		case "DD":
		return ('rgb(80,80,80)');
		case "NE":
		return ('rgb(0,0,0)');
		default:
		return ('rgb(0,0,0)');
	}
}

// definition of geological periods 
function gpmapper(datein)
{
	if (datein > 253.8)
	{
		return("pre Triassic");
	}
	else
	{
		if (datein > 203.6)
		{
			return("Triassic");
		}
		else
		{
			if (datein > 150.8)
			{
				return("Jurassic");
			}
			else
			{
				if (datein > 70.6)
				{
					return("Cretaceous");
				}
				else
				{
					if (datein > 28.4)
					{
						return("Paleogene");
					}
					else
					{
						if (datein > 3.6)
						{
							return("Neogene");
						}
						else
						{
							return("Quaternary");
						}	
					}	
				}	
			}	
		}
	}
	
}

midnode.prototype.leafcolor1 = function() 
{
	// for the leaf fill
	if ((this.redlist)&&(colourtype == 3))
	{
		return(redlistcolor(this.redlist));
	}
	else
	{
		if (colourtype == 3)
		{
			return (this.branchcolor());
		}
		else
		{
			return ('rgb(0,100,0)');
		}
	}
}


midnode.prototype.leafcolor2 = function() 
{
	// for the leaf outline
	if ((this.redlist)&&(colourtype == 3))
	{
		return(redlistcolor(this.redlist));
	}
	else
	{
		if (colourtype == 3)
		{
			return (this.branchcolor());
		}
		else
		{
			return ('rgb(0,100,0)');
		}
	}
}

midnode.prototype.leafcolor3 = function() 
{
	return ('rgb(255,255,255)'); // for the leaf text 
}

midnode.prototype.hitstextcolor = function() 
{
	// for text showing number of hits in each interior node (for search function)
	if ((this.npolyt)||(polytype == 3))
	{
		return ('rgb(255,255,255)');
	}
	else
	{
		return this.branchcolor(); 
	} 
}

midnode.prototype.branchcolor = function() // branch colour logic
{
	// this script sets the colours of the branches
	var colortoreturn = 'rgb(100,75,50)';
	if (colourtype == 2) // there are two different color schemes in this version described by the colourtype variable
	{
		// this.lengthbr is the date of the node
		// timelim is the cut of date beyond which the tree is not drawn (when using growth animation functions
		if ((this.lengthbr<150.8)&&(timelim<150.8)) 
		{
			colortoreturn =  'rgb(180,50,25)';
		}
		if ((this.lengthbr<70.6)&&(timelim<70.6))
		{
			colortoreturn =  'rgb(50,25,50)';
		}
	}
	else
	{
		
		var conservation = (4*(this.num_CR) + 3*(this.num_EN) + 2*(this.num_VU) + this.num_NT);
		var num_surveyed = (this.num_CR + this.num_EN + this.num_VU + this.num_NT + this.num_LC);
		if (colourtype == 3)
		{
			if (num_surveyed == 0)
			{
				if (((this.num_NE >= this.num_DD)&&(this.num_NE >= this.num_EW))&&(this.num_NE >= this.num_EX))
				{
					colortoreturn = redlistcolor("NE");
				}
				else
				{
					if ((this.num_DD >= this.num_EX)&&(this.num_DD >= this.num_EW))
					{
						colortoreturn = redlistcolor("DD");
					}
					else
					{
						if (this.num_EW >= this.num_EX)
						{
							colortoreturn = redlistcolor("EW");
						}
						else
						{
							colortoreturn = redlistcolor("EX");
						}
					}
				}
			}
			else
			{
				if ((conservation/num_surveyed)>3.5)
				{
					colortoreturn = redlistcolor("CR");
				}
				else
				{
					if ((conservation/num_surveyed)>2.5)
					{
						colortoreturn = redlistcolor("EN");
					}
					else
					{
						if ((conservation/num_surveyed)>1.5)
						{
							colortoreturn = redlistcolor("VU");
						}
						else
						{
							if ((conservation/num_surveyed)>0.5)
							{
								colortoreturn = redlistcolor("NT");
							}
							else
							{
								colortoreturn = redlistcolor("LC");
							}
						}
					}
				}
			}
		}
	}
	// the current logic uses different colorschemes for pre, post and during the Cretaceous period, if color type = 2 
	// otherwise it uses a fixed brown color for the branches
	// when the tree is growing it only allows branches to be coloured for a certain period if the tree has already growed up to that period.
	return colortoreturn;
}

midnode.prototype.barccolor = function() // branch outline colour logic
{
	// this script sets the color for the outline of the branches
	var colortoreturn = 'rgb(50,37,25)';
	if (colourtype == 2)
	{
		if((this.lengthbr<70.6)&&(timelim<70.6))
		{
			colortoreturn = 'rgb(200,200,200)';
		}
	}
	if (colourtype == 3)
	{
		colortoreturn = 'rgb(0,0,0)';
	}
	return colortoreturn;
}

midnode.prototype.highlightcolor = function() // highlight colour logic
{
	// this logic defines the stripe colors that indicate search results, but could be edited to indicate other features such as traits
	return 'rgb('+(Math.round(255-254*this.searchin/numhits)).toString()+','+(Math.round(255-254*this.searchin/numhits)).toString()+','+(Math.round(255-254*this.searchin/numhits)).toString()+')';
}

midnode.prototype.datetextcolor = function() // date text colour logic
{
	var colortoreturn = 'rgb(255,120,100)';
	if (colourtype == 2)
	{
		if ((this.lengthbr<150.8)&&(this.lengthbr>70.6))
		{
			colortoreturn = 'rgb(0,0,0)';
		}
	}
	if (colourtype == 3)
	{
		colortoreturn = 'rgb(255,255,255)';
	}
	return colortoreturn;
}

midnode.prototype.richnesstextcolor = function() // richness text colour logic
{
	var colortoreturn = 'rgb(200,200,255)';
	if (colourtype == 2)
	{
		if ((this.lengthbr<150.8)&&(this.lengthbr>70.6))
		{
			colortoreturn = 'rgb(0,0,250)';
		}
	}
	if (colourtype == 3)
	{
		colortoreturn = 'rgb(255,255,255)';
	}
	return colortoreturn;
}

// it is not advisable to edit below this point unless you are trying to sort out the display of custom trait data

// *** there are three types of leaves that are drawn by the code
// *** 1.) Fake leaf: where the tree continues but is smaller than the size threshold it is sometimes
// *** asthetically pleasing to draw a leaf there, especially if the threshold is a few pixels wide.  If the threshold is much smaller it does not matter if the facke leaf is drawn or not.
// *** 2.) Growth leaf: where growing animations are taking place there should be leaves on the tips of the branches
// *** 3.) Tip leaf: these are the classic leaves in which species names are put - these are the tips of the complete tree.
// *** all leaf classes can be defined with custom logic in the three scripts below

midnode.prototype.fakeleaflogic = function(x,y,r,angle)
{
	context.strokeStyle = this.leafcolor2();
	context.fillStyle = this.leafcolor1();	
	if (leaftype == 1)
	{
		drawleaf1(x,y,r);
	}
	else
	{
		drawleaf2(x,y,r,angle);
	}
}

midnode.prototype.growthleaflogic = function(x,y,r,angle)
{
	context.strokeStyle = this.leafcolor2();
	context.fillStyle = this.leafcolor1();	
	if (leaftype == 1)
	{
		drawleaf1(x,y,r);
	}
	else
	{
		drawleaf2(x,y,r,angle);
	}
}

midnode.prototype.tipleaflogic = function(x,y,r,angle)
{
	context.strokeStyle = this.leafcolor2();
	context.fillStyle = this.leafcolor1();	
	if (leaftype == 1)
	{
		drawleaf1(x,y,r);
	}
	else
	{
		drawleaf2(x,y,r,angle);
	}
}


// drawing the tree
midnode.prototype.draw = function()
{
	var x ;
	var y ;
	var r ;
	if(this.dvar)
	{
		if (this.rvar)
		{
			x = this.xvar;
			y = this.yvar;
			r = this.rvar;
		}
		if ((this.child1)&&(this.lengthbr > timelim))
		{
			if ((this.child1.richness_val) >= (this.child2.richness_val))
			{
				this.child1.draw ();
				this.child2.draw ();
			}
			else
			{
				this.child2.draw ();
				this.child1.draw ();
			}
		}
		var ing = false; // if we are in the region where graphics need to be drawn
		if((this.gvar)&&((polytype!=2)||(this.npolyt)))
		{
			
			ing = true;
			context.lineCap = "round";
			context.lineWidth = r*(this.bezr);
			context.beginPath();
			context.moveTo(x+r*(this.bezsx),y+r*this.bezsy);
			context.bezierCurveTo(x+r*(this.bezc1x),y+r*(this.bezc1y),x+r*(this.bezc2x),y+r*(this.bezc2y),x+r*(this.bezex),y+r*(this.bezey));
			context.strokeStyle = this.branchcolor();
			context.stroke();
			if ((highlight_search)&&(this.searchin > 0)) 
			{
				context.lineWidth = r*(this.bezr)/3;
				context.strokeStyle = 'rgb(255,255,255)';
				context.beginPath();
				context.moveTo(x+r*(this.bezsx),y+r*this.bezsy);
				context.bezierCurveTo(x+r*(this.bezc1x),y+r*(this.bezc1y),x+r*(this.bezc2x),y+r*(this.bezc2y),x+r*(this.bezex),y+r*(this.bezey));
				context.stroke();
				context.strokeStyle = this.highlightcolor();
				context.lineWidth = r*(this.bezr)/5.0;
				context.beginPath();
				context.moveTo(x+r*(this.bezsx),y+r*this.bezsy);
				context.bezierCurveTo(x+r*(this.bezc1x),y+r*(this.bezc1y),x+r*(this.bezc2x),y+r*(this.bezc2y),x+r*(this.bezex),y+r*(this.bezey));
				context.stroke();
			}
		}
		if (this.lengthbr > timelim)
		{
			if (((this.richness_val > 1)&&(r<=threshold))&&(timelim <= 0))
			{
				// we are drawing a fake leaf - ing is irrelevant as this is instead of drawing the children
				this.fakeleaflogic(x+((r)*(this.nextx1)),y+(r)*(this.nexty1),r*leafmult*0.75*partc,this.arca);
			}
			else
			{
				if (ing)
				{
					if (this.richness_val > 1)
					{
						if (this.lengthbr > timelim)
						{
							// interior node drawing starts here 
							// first set up the variables that decide text size
							var temp_twidth = (r*partc-r*partl2)*Twidth;
							var temp_theight = (r*partc-r*partl2)*Tsize/2.0;
							var temp_theight_2 = (r*partc-r*partl2)*Tsize/3.0;
							// this piece of logic draws the arc background if needed (no text)
							if ((highlight_search)&&(this.searchin > 0))
							{
								context.beginPath();
								context.arc(x+r*(this.arcx),y+r*this.arcy,r*this.arcr*(1-partl2/2.0),0,Math.PI*2,true);
								if ((this.npolyt)||(polytype == 3))
								{
									context.fillStyle = this.branchcolor();
								}
								else
								{
									context.fillStyle = this.highlightcolor();
								}
								context.fill();
							}
							if (((this.npolyt)||((highlight_search)&&(this.searchin > 0)))||(polytype == 3))
							{
								// we are drawing an internal circle
								context.beginPath();
								context.arc(x+r*(this.arcx),y+r*this.arcy,r*this.arcr*(1-partl2/2.0),0,Math.PI*2,true);
								context.lineWidth = r*this.arcr*partl2;
								context.strokeStyle = this.barccolor();
								context.stroke();
							}
							// internal text drawing starts here *****
							if ((this.npolyt)||(polytype == 3))
							{	
								if (datahastraits)
								{
								// drawing internal text
								if ( r > threshold*7)
								{
									// DRAW	PIECHARTS
									
									if (r > threshold*45)
									{
										
										context.fillStyle = 'rgb(255,255,255)';
										
										context.beginPath();
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/3.3,0,Math.PI*2,true);
										context.fill();
										
										if (r > threshold*250)
										{
											
											for (i = 0 ; i < 9 ; i ++)
											{
												context.beginPath();
												context.arc(x+r*this.arcx+temp_theight*i*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.05,0,Math.PI*2,true);
												context.fill();
											}
											context.fillStyle = redlistcolor("EX");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*0*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = redlistcolor("EW");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*1*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = redlistcolor("CR");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = redlistcolor("EN");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = redlistcolor("VU");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = redlistcolor("NT");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*5*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = redlistcolor("LC");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*6*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = redlistcolor("DD");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*7*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = redlistcolor("NE");
											context.beginPath();
											context.arc(x+r*this.arcx+temp_theight*8*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,0,Math.PI*2,true);
											context.fill();
											context.fillStyle = this.leafcolor3();
											autotext(false,"EX", x+r*this.arcx+temp_theight*0*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,"EW", x+r*this.arcx+temp_theight*1*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,"CR", x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,"EN", x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,"VU", x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,"NT", x+r*this.arcx+temp_theight*5*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,"LC", x+r*this.arcx+temp_theight*6*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,"DD", x+r*this.arcx+temp_theight*7*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,"NE", x+r*this.arcx+temp_theight*8*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.09,temp_theight*0.04,temp_theight*0.04);
											autotext(false,conconvert("EX"), x+r*this.arcx+temp_theight*0*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											autotext(false,conconvert("EW"), x+r*this.arcx+temp_theight*1*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											autotext(false,conconvert("CR"), x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											autotext(false,conconvert("EN"), x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											autotext(false,conconvert("VU"), x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											autotext(false,conconvert("NT"), x+r*this.arcx+temp_theight*5*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											autotext(false,conconvert("LC"), x+r*this.arcx+temp_theight*6*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											autotext(false,conconvert("DD"), x+r*this.arcx+temp_theight*7*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											autotext(false,conconvert("NE"), x+r*this.arcx+temp_theight*8*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.12,temp_theight*0.04,temp_theight*0.005);
											
											autotext(false,(Math.round(10000.0*(this.num_EX/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*0*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											autotext(false,(Math.round(10000.0*(this.num_EW/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*1*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											autotext(false,(Math.round(10000.0*(this.num_CR/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											autotext(false,(Math.round(10000.0*(this.num_EN/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											autotext(false,(Math.round(10000.0*(this.num_VU/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											autotext(false,(Math.round(10000.0*(this.num_NT/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*5*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											autotext(false,(Math.round(10000.0*(this.num_LC/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*6*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											autotext(false,(Math.round(10000.0*(this.num_DD/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*7*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											autotext(false,(Math.round(10000.0*(this.num_NE/this.richness_val))/100.0).toString() + " %", x+r*this.arcx+temp_theight*8*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.045,temp_theight*0.04,temp_theight*0.008);
											
											autotext(false,(this.num_EX).toString() + " species", x+r*this.arcx+temp_theight*0*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											autotext(false,(this.num_EW).toString() + " species", x+r*this.arcx+temp_theight*1*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											autotext(false,(this.num_CR).toString() + " species", x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											autotext(false,(this.num_EN).toString() + " species", x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											autotext(false,(this.num_VU).toString() + " species", x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											autotext(false,(this.num_NT).toString() + " species", x+r*this.arcx+temp_theight*5*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											autotext(false,(this.num_LC).toString() + " species", x+r*this.arcx+temp_theight*6*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											autotext(false,(this.num_DD).toString() + " species", x+r*this.arcx+temp_theight*7*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											autotext(false,(this.num_NE).toString() + " species", x+r*this.arcx+temp_theight*8*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.06,temp_theight*0.04,temp_theight*0.005);
											
											autotext(true,"Threatened", x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.132,temp_theight_2*0.04,temp_theight*0.005);
											autotext(true,"Threatened", x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.132,temp_theight_2*0.04,temp_theight*0.005);
											autotext(true,"Threatened", x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight_2*1.132,temp_theight_2*0.04,temp_theight*0.005);
										}
										
										var pieangle = 0;
										var newpieangle = pieangle+(this.num_LC/this.richness_val)*Math.PI*2 +0.1;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}
										context.fillStyle = redlistcolor("LC")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle-0.1,newpieangle,false);
										pieangle +=(this.num_LC/this.richness_val)*Math.PI*2;
										context.fill();
										
										newpieangle = pieangle+(this.num_NT/this.richness_val)*Math.PI*2 +0.1;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}
										context.fillStyle = redlistcolor("NT")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle,newpieangle,false);
										pieangle +=(this.num_NT/this.richness_val)*Math.PI*2;
										context.fill();
										
										newpieangle = pieangle+(this.num_VU/this.richness_val)*Math.PI*2 +0.1;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}

										context.fillStyle = redlistcolor("VU")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle,newpieangle,false);
										pieangle +=(this.num_VU/this.richness_val)*Math.PI*2;
										context.fill();
										newpieangle = pieangle+(this.num_EN/this.richness_val)*Math.PI*2 +0.1;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}

										context.fillStyle = redlistcolor("EN")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle,newpieangle,false);
										pieangle +=(this.num_EN/this.richness_val)*Math.PI*2;
										context.fill();
										newpieangle = pieangle+(this.num_CR/this.richness_val)*Math.PI*2 +0.1;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}

										context.fillStyle = redlistcolor("CR")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle,newpieangle,false);
										pieangle +=(this.num_CR/this.richness_val)*Math.PI*2;
										context.fill();
										newpieangle = pieangle+(this.num_EW/this.richness_val)*Math.PI*2 +0.1;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}

										context.fillStyle = redlistcolor("EW")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle,newpieangle,false);
										pieangle +=(this.num_EW/this.richness_val)*Math.PI*2;
										context.fill();
										newpieangle = pieangle+(this.num_EX/this.richness_val)*Math.PI*2 +0.1;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}

										context.fillStyle = redlistcolor("EX")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle,newpieangle,false);
										pieangle +=(this.num_EX/this.richness_val)*Math.PI*2;
										context.fill();
										newpieangle = pieangle+(this.num_DD/this.richness_val)*Math.PI*2 +0.1;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}

										context.fillStyle = redlistcolor("DD")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle,newpieangle,false);
										pieangle +=(this.num_DD/this.richness_val)*Math.PI*2;
										context.fill();
										newpieangle = pieangle+(this.num_NE/this.richness_val)*Math.PI*2;
										if (newpieangle > Math.PI*2)
										{
											newpieangle = Math.PI*2;
										}

										context.fillStyle = redlistcolor("NE")
										context.beginPath();
										context.moveTo(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7);
										context.arc(x+r*this.arcx,y+r*this.arcy+temp_theight_2*1.7,temp_theight/4,pieangle,newpieangle,false);
										pieangle +=(this.num_NE/this.richness_val)*Math.PI*2;
										context.fill();
										
										context.fillStyle = intnodetextcolor;
										autotext(false,"conservation status" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.9,temp_twidth*0.5,temp_theight_2/5.0);
										
																					
									}
									
									// DO THE TEXT
								
									if ((this.child1)&&(this.lengthbr))
									{
										context.fillStyle = this.datetextcolor();
										if (this.lengthbr >10)
										{
											autotext(false,(Math.round((this.lengthbr)*10)/10.0).toString() + " Mya", x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.32,temp_twidth,temp_theight_2/1.5);
											autotext(false,gpmapper(this.lengthbr) + " Period", x+r*this.arcx,y+r*this.arcy-temp_theight_2*0.82,temp_twidth,temp_theight_2/5.0);
										}
										else
										{
											if (this.lengthbr >1)
											{
												autotext(false,(Math.round((this.lengthbr)*100)/100.0).toString()  + " Mya", x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.32,temp_twidth,temp_theight_2/1.5);
												autotext(false,gpmapper(this.lengthbr) + " Period", x+r*this.arcx,y+r*this.arcy-temp_theight_2*0.82,temp_twidth,temp_theight_2/5.0);
											}
											else
											{
												autotext(false,(Math.round((this.lengthbr)*10000)/10.0).toString()  + " Kya", x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.32,temp_twidth,temp_theight_2/1.5);
												autotext(false,gpmapper(this.lengthbr) + " Period", x+r*this.arcx,y+r*this.arcy-temp_theight_2*0.82,temp_twidth,temp_theight_2/5.0);
											}
										}
									}
									
									var num_threatened = (this.num_CR + this.num_EN + this.num_VU);

									if ((this.inlabel == true)&&((this.name2) != null))
									{
										context.fillStyle = intnodetextcolor;
										autotext(true,this.name2 , x+r*this.arcx,y+r*this.arcy-temp_theight_2*0.17,temp_twidth*1.35,temp_theight_2/1.5);
										
										context.fillStyle = this.richnesstextcolor();
										//*
										if (num_threatened > 0)
										{
											autotext(false,(this.richness_val).toString() + " species , " + (num_threatened).toString() + " threatened ( " + (Math.round((num_threatened)/(this.richness_val)*1000.0)/10.0).toString() + "% )" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.5,temp_twidth*1.2,temp_theight_2/4.3);
										}
										else
										{
											autotext(false,(this.richness_val).toString() + " species, none threatened" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.5,temp_twidth,temp_theight_2/4.3);
										}
										if(this.phylogenetic_diversity>1000.0) 
										{
											autotext(false,(Math.round(this.phylogenetic_diversity/100)/10.0).toString() + " billion years total phylogenetic diversity" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.72,temp_twidth,temp_theight_2/5.0);
										}
										else
										{
											autotext(false,(Math.round(this.phylogenetic_diversity)).toString() + " million years total phylogenetic diversity" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.72,temp_twidth,temp_theight_2/5.0);
										}
										
										var linkpos = 0;
										
										if ((this.npolyt)||(polytype != 2))
										{
											if ((highlight_search)&&(this.searchin > 0))
											{
												context.fillStyle = this.hitstextcolor();
												if (this.searchin > 1)
												{
													autotext(false,(this.searchin).toString() + " hits" ,  x+r*this.arcx-temp_theight_2*0.3,y+r*this.arcy-temp_theight_2*1.95,temp_twidth*0.5,temp_theight_2*0.2);
												}
												else
												{
													autotext(false,"1 hit" ,  x+r*this.arcx-temp_theight_2*0.3,y+r*this.arcy-temp_theight_2*1.95,temp_theight_2*0.6,temp_theight_2*0.2);
												}
												linkpos = temp_theight_2*0.45;
											}
										}
										if ( r > threshold*100)
										{
											if ((this.linkclick)&&((!this.child1.linkclick)&&(!this.child2.linkclick)))
											{
												context.fillStyle = 'rgb(0,0,0)';
												context.beginPath();
												context.arc(x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.12,0,Math.PI*2,true);
												context.fill();
												context.fillStyle = 'rgb(255,255,255)';
												context.beginPath();
												context.arc(x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.1,0,Math.PI*2,true);
												context.fill();
												context.fillStyle = intnodetextcolor;
												context.fillStyle = 'rgb(0,0,0)';
												
												autotext(true,"Wikipedia", x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.17,temp_theight_2/10.0);
											}
											else
											{
												context.fillStyle = 'rgb(255,255,255)';
												context.beginPath();
												context.arc(x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.12,0,Math.PI*2,true);
												context.fill();
												context.fillStyle = this.branchcolor();
												context.beginPath();
												context.arc(x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.1,0,Math.PI*2,true);
												context.fill();
												context.fillStyle = intnodetextcolor;
												context.fillStyle = 'rgb(255,255,255)';
												
												autotext(true,"Wikipedia", x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.17,temp_theight_2/10.0);
											}
										}
									}
									else
									{
										
										context.fillStyle = this.richnesstextcolor();
										autotext(false,(this.richness_val).toString() + " species",  x+r*this.arcx,y+r*this.arcy+temp_theight_2*-0.17,temp_twidth*1.35,temp_theight_2/1.5);
										
										if (num_threatened > 0)
										{
											if (num_threatened > 1)
											{
												autotext(false,(num_threatened).toString() + " of " + (this.richness_val).toString() + " species are threatened ( " + (Math.round((num_threatened)/(this.richness_val)*1000.0)/10.0).toString() + "% )" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.45,temp_twidth,temp_theight_2/5.0);
											}
											else
											{
												autotext(false,(num_threatened).toString() + " of " + (this.richness_val).toString() + " species is threatened ( " + (Math.round((num_threatened)/(this.richness_val)*1000.0)/10.0).toString() + "% )" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.45,temp_twidth,temp_theight_2/5.0);
											}
										}
										else
										{
											autotext(false,"no threatened species" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.45,temp_twidth*0.75,temp_theight_2/5.0);
										}
										if(this.phylogenetic_diversity>1000.0) 
										{
											autotext(false,(Math.round(this.phylogenetic_diversity/100)/10.0).toString() + " billion years total phylogenetic diversity" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.65,temp_twidth,temp_theight_2/5.0);
										}
										else
										{
											autotext(false,(Math.round(this.phylogenetic_diversity)).toString() + " million years total phylogenetic diversity" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.65,temp_twidth,temp_theight_2/5.0);
										}
										
										if ((this.npolyt)||(polytype != 2))
										{
											if ((highlight_search)&&(this.searchin > 0))
											{
												context.fillStyle = this.hitstextcolor();
												if (this.searchin > 1)
												{
													autotext(false,(this.searchin).toString() + " hits" ,  x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.85,temp_twidth*0.5,temp_theight_2*0.2);
												}
												else
												{
													autotext(false,"1 hit" ,  x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.85,temp_twidth*0.5,temp_theight_2*0.2);
												}
												
											}
										}
										
									}
								}
								}
								else
								{
								if ((this.child1)&&(this.lengthbr))
									{
										context.fillStyle = this.datetextcolor();
										if (this.lengthbr >10)
										{
											autotext(false,(Math.round((this.lengthbr)*10)/10.0).toString() + " Mya", x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.32,temp_twidth,temp_theight_2/1.5);
											autotext(false,gpmapper(this.lengthbr) + " Period", x+r*this.arcx,y+r*this.arcy-temp_theight_2*0.82,temp_twidth,temp_theight_2/5.0);
										}
										else
										{
											if (this.lengthbr >1)
											{
												autotext(false,(Math.round((this.lengthbr)*100)/100.0).toString()  + " Mya", x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.32,temp_twidth,temp_theight_2/1.5);
												autotext(false,gpmapper(this.lengthbr) + " Period", x+r*this.arcx,y+r*this.arcy-temp_theight_2*0.82,temp_twidth,temp_theight_2/5.0);
											}
											else
											{
												autotext(false,(Math.round((this.lengthbr)*10000)/10.0).toString()  + " Kya", x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.32,temp_twidth,temp_theight_2/1.5);
												autotext(false,gpmapper(this.lengthbr) + " Period", x+r*this.arcx,y+r*this.arcy-temp_theight_2*0.82,temp_twidth,temp_theight_2/5.0);
											}
										}
									}
									if ((this.inlabel == true)&&((this.name2) != null))
									{
										context.fillStyle = intnodetextcolor;
										autotext(true,this.name2 , x+r*this.arcx,y+r*this.arcy-temp_theight_2*0.17,temp_twidth*1.35,temp_theight_2/1.5);
										
										context.fillStyle = this.richnesstextcolor();
										//*
										autotext(false,(this.richness_val).toString() + " species" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.5,temp_twidth*1.2,temp_theight_2/4.3);
										
										if(this.phylogenetic_diversity>1000.0) 
										{
											autotext(false,(Math.round(this.phylogenetic_diversity/100)/10.0).toString() + " billion years total phylogenetic diversity" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.72,temp_twidth,temp_theight_2/5.0);
										}
										else
										{
											autotext(false,(Math.round(this.phylogenetic_diversity)).toString() + " million years total phylogenetic diversity" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.72,temp_twidth,temp_theight_2/5.0);
										}
										
										var linkpos = 0;
										
										if ((this.npolyt)||(polytype != 2))
										{
											if ((highlight_search)&&(this.searchin > 0))
											{
												context.fillStyle = this.hitstextcolor();
												if (this.searchin > 1)
												{
													autotext(false,(this.searchin).toString() + " hits" ,  x+r*this.arcx-temp_theight_2*0.3,y+r*this.arcy-temp_theight_2*1.95,temp_twidth*0.5,temp_theight_2*0.2);
												}
												else
												{
													autotext(false,"1 hit" ,  x+r*this.arcx-temp_theight_2*0.3,y+r*this.arcy-temp_theight_2*1.95,temp_theight_2*0.6,temp_theight_2*0.2);
												}
												linkpos = temp_theight_2*0.45;
											}
										}
										if ( r > threshold*100)
										{
											if ((this.linkclick)&&((!this.child1.linkclick)&&(!this.child2.linkclick)))
											{
												context.fillStyle = 'rgb(0,0,0)';
												context.beginPath();
												context.arc(x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.12,0,Math.PI*2,true);
												context.fill();
												context.fillStyle = 'rgb(255,255,255)';
												context.beginPath();
												context.arc(x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.1,0,Math.PI*2,true);
												context.fill();
												context.fillStyle = intnodetextcolor;
												context.fillStyle = 'rgb(0,0,0)';
												
												autotext(true,"Wikipedia", x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.17,temp_theight_2/10.0);
											}
											else
											{
												context.fillStyle = 'rgb(255,255,255)';
												context.beginPath();
												context.arc(x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.12,0,Math.PI*2,true);
												context.fill();
												context.fillStyle = this.branchcolor();
												context.beginPath();
												context.arc(x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.1,0,Math.PI*2,true);
												context.fill();
												context.fillStyle = intnodetextcolor;
												context.fillStyle = 'rgb(255,255,255)';
												
												autotext(true,"Wikipedia", x+r*this.arcx+linkpos,y+r*this.arcy-temp_theight_2*1.95,temp_theight*0.17,temp_theight_2/10.0);
											}
										}
									}
									else
									{
										
										context.fillStyle = this.richnesstextcolor();
										autotext(false,(this.richness_val).toString() + " species",  x+r*this.arcx,y+r*this.arcy+temp_theight_2*-0.17,temp_twidth*1.35,temp_theight_2/1.5);
			
										if(this.phylogenetic_diversity>1000.0) 
										{
											autotext(false,(Math.round(this.phylogenetic_diversity/100)/10.0).toString() + " billion years total phylogenetic diversity" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.65,temp_twidth,temp_theight_2/5.0);
										}
										else
										{
											autotext(false,(Math.round(this.phylogenetic_diversity)).toString() + " million years total phylogenetic diversity" ,  x+r*this.arcx,y+r*this.arcy+temp_theight_2*0.65,temp_twidth,temp_theight_2/5.0);
										}
										
										if ((this.npolyt)||(polytype != 2))
										{
											if ((highlight_search)&&(this.searchin > 0))
											{
												context.fillStyle = this.hitstextcolor();
												if (this.searchin > 1)
												{
													autotext(false,(this.searchin).toString() + " hits" ,  x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.85,temp_twidth*0.5,temp_theight_2*0.2);
												}
												else
												{
													autotext(false,"1 hit" ,  x+r*this.arcx,y+r*this.arcy-temp_theight_2*1.85,temp_twidth*0.5,temp_theight_2*0.2);
												}
												
											}
										}
										
									}
								}
							}
							else
							{
								// polytomy node filling
								if (polytype ==1)
								{
									context.beginPath();
									context.arc(x+r*(this.arcx),y+r*this.arcy,r*this.arcr,0,Math.PI*2,true);
									context.fillStyle = this.barccolor();
									context.fill();
								}
							}
							// draw number of hits / number threatened
						}
					}
					else
					{
						// we are drawing a leaf
						this.tipleaflogic(x+((r)*this.arcx),y+(r)*this.arcy,r*this.arcr,this.arca);
						if ( (r*leafmult) > threshold*10)
						{
							this.leafdetail(x,y,r,leafmult,partc,partl2,Twidth,Tsize);
						}	
					}
				}
			}
		}
		if (this.lengthbr <= timelim)
		{
			if (this.richness_val > 1)
			{
				this.growthleaflogic(x+((r)*(this.arcx)),y+(r)*(this.arcy),r*leafmult*0.5*partc,this.arca);
			}
			else
			{
				this.tipleaflogic(x+((r)*this.arcx),y+(r)*this.arcy,r*this.arcr,this.arca);
				if ( (r*leafmult) > threshold*10)
				{
					this.leafdetail(x,y,r,leafmult,partc,partl2,Twidth,Tsize);
				}	
			}
		}
	}
}

midnode.prototype.leafdetail = function(x,y,r,leafmult,partc,partl2,Twidth,Tsize)
{
	if ( r > threshold*6)
	{
		var temp_twidth = (r*leafmult*partc-r*leafmult*partl2)*Twidth;
		var temp_theight = ((r*leafmult*partc-r*leafmult*partl2)*Tsize/3.0);
		
		if (temp_theight*0.2 > threshold/2.5)
		{
			if (this.linkclick)
			{
				context.fillStyle = 'rgb(0,0,0)';
				context.beginPath();
				context.arc(x+r*this.arcx,y+r*this.arcy-temp_theight*1.75,temp_theight*0.2,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = 'rgb(255,255,255)';
				context.beginPath();
				context.arc(x+r*this.arcx,y+r*this.arcy-temp_theight*1.75,temp_theight*0.15,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = 'rgb(0,0,0)';
				autotext(true,"Wikipedia", x+r*this.arcx,y+r*this.arcy-temp_theight*1.75,temp_twidth*0.1,temp_theight*0.5);
			}
			else
			{
				context.fillStyle = 'rgb(255,255,255)';
				context.beginPath();
				context.arc(x+r*this.arcx,y+r*this.arcy-temp_theight*1.75,temp_theight*0.2,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = this.leafcolor2();
				context.beginPath();
				context.arc(x+r*this.arcx,y+r*this.arcy-temp_theight*1.75,temp_theight*0.15,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = this.leafcolor3();
				autotext(true,"Wikipedia", x+r*this.arcx,y+r*this.arcy-temp_theight*1.75,temp_twidth*0.1,temp_theight*0.5);
			}
		}
		
		context.fillStyle = this.leafcolor3();
		
		if (datahastraits)
		{
			if (this.cname)
			{
				if (this.hasname2)
				{
					autotext(true,this.name2 + " " + this.name1, x+r*this.arcx,y+r*this.arcy-temp_theight*1.2,temp_twidth*1,temp_theight*0.5);
				}
				else
				{
					autotext(true,this.name1, x+r*this.arcx,y+r*this.arcy-temp_theight*1.2,temp_twidth*1,temp_theight*0.5);
				}
				autotext2(false,this.cname,x+r*this.arcx,y+r*this.arcy,temp_twidth*1.6,temp_theight*0.75);
			}
			else
			{
				autotext(false,"No common name", x+r*this.arcx,y+r*this.arcy-temp_theight*1.2,temp_twidth*1,temp_theight*0.5);
				if (this.hasname2)
				{
					autotext2(true,this.name2 + " " + this.name1,x+r*this.arcx,y+r*this.arcy,temp_twidth*1.6,temp_theight*0.75);
				}
				else
				{
					autotext2(true,this.name1,x+r*this.arcx,y+r*this.arcy,temp_twidth*1.6,temp_theight*0.75);
				}
			}
			autotext(false,"Conservation status: " + this.redlist + " , " + "population " + this.poptxt() , x+r*this.arcx,y+r*this.arcy+temp_theight*1.6,temp_twidth*1.2,temp_theight*0.15);
			autotext(false,this.extxt() , x+r*this.arcx,y+r*this.arcy+temp_theight*1.2,temp_twidth*1.4,temp_theight*0.5);
			
			if (temp_theight*0.05 > threshold*1.5)
			{
				context.fillStyle = this.leafcolor3();
				
				for (i = 0 ; i < 9 ; i ++)
				{
					context.beginPath();
					context.arc(x+r*this.arcx+temp_theight*i*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.05,0,Math.PI*2,true);
					context.fill();
				}
				
				context.fillStyle = redlistcolor("EX");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*0*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = redlistcolor("EW");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*1*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = redlistcolor("CR");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = redlistcolor("EN");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = redlistcolor("VU");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = redlistcolor("NT");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*5*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = redlistcolor("LC");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*6*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = redlistcolor("DD");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*7*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = redlistcolor("NE");
				context.beginPath();
				context.arc(x+r*this.arcx+temp_theight*8*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,0,Math.PI*2,true);
				context.fill();
				context.fillStyle = this.leafcolor3();
				autotext(false,"EX", x+r*this.arcx+temp_theight*0*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,"EW", x+r*this.arcx+temp_theight*1*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,"CR", x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,"EN", x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,"VU", x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,"NT", x+r*this.arcx+temp_theight*5*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,"LC", x+r*this.arcx+temp_theight*6*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,"DD", x+r*this.arcx+temp_theight*7*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,"NE", x+r*this.arcx+temp_theight*8*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.9,temp_theight*0.04,temp_theight*0.04);
				autotext(false,conconvert("EX"), x+r*this.arcx+temp_theight*0*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(false,conconvert("EW"), x+r*this.arcx+temp_theight*1*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(false,conconvert("CR"), x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(false,conconvert("EN"), x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(false,conconvert("VU"), x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(false,conconvert("NT"), x+r*this.arcx+temp_theight*5*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(false,conconvert("LC"), x+r*this.arcx+temp_theight*6*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(false,conconvert("DD"), x+r*this.arcx+temp_theight*7*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(false,conconvert("NE"), x+r*this.arcx+temp_theight*8*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.921,temp_theight*0.04,temp_theight*0.005);
				autotext(true,"Threatened", x+r*this.arcx+temp_theight*2*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.879,temp_theight*0.04,temp_theight*0.005);
				autotext(true,"Threatened", x+r*this.arcx+temp_theight*3*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.879,temp_theight*0.04,temp_theight*0.005);
				autotext(true,"Threatened", x+r*this.arcx+temp_theight*4*0.15-4*0.15*temp_theight,y+r*this.arcy+temp_theight*1.879,temp_theight*0.04,temp_theight*0.005);
			}
		}
		else
		{
			if (this.hasname2)
			{
				autotext2(true,this.name2 + " " + this.name1,x+r*this.arcx,y+r*this.arcy,temp_twidth*1.6,temp_theight*0.75);
			}
			else
			{
				autotext2(true,this.name1,x+r*this.arcx,y+r*this.arcy,temp_twidth*1.6,temp_theight*0.75);
			}
		}
	}
}

function performsearch2(toclear)
{
	var changedvar = false;
	var stringin = document.forms["myform"]["tosearchfor"].value;
	
	stringin = stringin.replace("extinct in the wild", "EW");
	stringin = stringin.replace("extinct", "EX");
	stringin = stringin.replace("critically endangered", "CR");
	stringin = stringin.replace("endangered", "EN");
	stringin = stringin.replace("vulnerable", "VU");
	stringin = stringin.replace("near threatened", "NT");
	stringin = stringin.replace("least concern", "LC");
	stringin = stringin.replace("data deficient", "DD");
	stringin = stringin.replace("not evaluated", "NE");
	
	var searchinpartsnew = stringin.split(" ");
	
	if (searchinpartsnew.length == searchinparts.length)
	{
		for (i = 0 ; i < searchinpartsnew.length ; i ++)
		{
			if (searchinpartsnew[i] != searchinparts[i])
			{
				changedvar = true;
			}
		}
	}
	else
	{
		changedvar = true;
	}
	
	if (latin_search != (document.forms["myform"]["latinsearch"].checked))
	{
		changedvar = true;
		latin_search = (document.forms["myform"]["latinsearch"].checked)
	}
	if (common_search != (document.forms["myform"]["commonsearch"].checked))
	{
		changedvar = true;
		common_search = (document.forms["myform"]["commonsearch"].checked)
	}
	if (trait_search != (document.forms["myform"]["traitsearch"].checked))
	{
		changedvar = true;
		trait_search = (document.forms["myform"]["traitsearch"].checked)
	}
	
	if (!changedvar)
	{
		if (toclear)
		{
			fulltree.semiclearsearch();
		}
		changedvar = false;
	}
	else
	{
		fulltree.clearsearch();
		searchinparts = searchinpartsnew;
		numhits = fulltree.search();
		changedvar = true;
	}
	return changedvar;
}

midnode.prototype.searchone = function(stringin,leafonly)
{
	var foundstr = 0;
	
	if (document.forms["myform"]["traitsearch"].checked)
	{
		if ((((stringin == "EX")||(stringin == "EW"))||(((stringin == "EN")||(stringin == "CR"))||((stringin == "VU")||(stringin == "NT"))))||(((stringin == "DD")||(stringin == "LC"))||(stringin == "NE")))
		{
			if (!(this.child1))
			{
				if ((this.redlist)&&(this.redlist == stringin))
				{
					foundstr +=this.richness_val;
				}
			}
		}
		else
		{
			if (((stringin.toLowerCase() == "increasing")&&(this.popstab))&&(this.popstab == "I"))
			{
				foundstr +=this.richness_val;
			}
			else
			{
				if (((stringin.toLowerCase() == "decreasing")&&(this.popstab))&&(this.popstab == "D"))
				{
					foundstr +=this.richness_val;
				}
				else
				{
					if (((stringin.toLowerCase() == "stable")&&(this.popstab))&&(this.popstab == "S"))
					{
						foundstr +=this.richness_val;
					}
					else
					{
						if ((stringin.toLowerCase() == "threatened")&&((this.redlist)&&(((this.redlist == "CR")||(this.redlist == "EN"))||(this.redlist == "VU"))))
						{
							foundstr +=this.richness_val;
						}
					}
				}
			}
		}
	}
	if (foundstr == 0 && (document.forms["myform"]["latinsearch"].checked))
	{
		
		if ((stringin.toLowerCase()) == stringin)
		{
			if (!((leafonly)&&(this.child1)))
			{
				if ((this.hasname1)&&((this.name1.toLowerCase()).search(stringin) != -1))
				{
					foundstr += this.richness_val;
				}
				else
				{
					if ((this.name2)&&((this.name2.toLowerCase()).search(stringin) != -1))
					{
						foundstr +=this.richness_val;
					}
					
				}
			}
		}
		else
		{
			if (!((leafonly)&&(this.child1)))
			{
				if ((this.hasname1)&&((this.name1).search(stringin) != -1))
				{
					foundstr += this.richness_val;
				}
				else
				{
					if ((this.name2)&&((this.name2).search(stringin) != -1))
					{
						foundstr +=this.richness_val;
					}
					
				}
			}
		}
		
	}
	
	if (foundstr == 0 && (document.forms["myform"]["commonsearch"].checked))
	{
		
		if ((stringin.toLowerCase()) == stringin)
		{
			if ((this.cname)&&((this.cname.toLowerCase()).search(stringin) != -1))
			{
				foundstr +=this.richness_val;
			}
		}
		else
		{
			if ((this.cname)&&((this.cname).search(stringin) != -1))
			{
				foundstr +=this.richness_val;
			}
		}
	}	
	return foundstr;
}

function midnode (x)
{
	// all the graphics parameters referenced from the reference point and reference scale which are set once and changed only when the fractal form is changed
	
	// for bezier curve (basic graphics element 1 of 2)
	var bezsx; // start x position
	var bezsy; // start y position
	var bezex; // end x position
	var bezey; // end y position
	var bezc1x; // control point 1 x position
	var bezc1y; // control point 2 y position
	var bezc2x; // control point 2 x position
	var bezc2y; // control point 2 y position
	var bezr; // line width
	
	// for the circle (basic graphics element 2 of 2)
	var arcx; // centre x position
	var arcy; // centre y position
	var arcr; // radius
	var arca; // angle of the arc
	
	// for the horizon (the region within which all graphics elements of this node and all its child nodes are contained)
	var hxmin; // min x value
	var hxmax; // max x value
	var hymin; // min y value
	var hymax; // max y value
	
	// for the graphics box (the region within which all graphics elements of this node alone (excluding its children) are contained
	var gxmin; // min x value
	var gxmax; // max x value
	var gymin; // min y value
	var gymax; // max y value
	
	// for the flight box (frames the region that defines a nice flight to the target after a search)
	var fxmin; // min x value
	var fxmax; // max x value
	var fymin; // min y value
	var fymax; // max y value
	
	// for the reference points of the two children
	var nextx1; // x refernece point for both children
	var nexty1; // y reference point for both children
	var nextx2; // x refernece point for both children
	var nexty2; // y reference point for both children
	var nextr1; // r (scale) reference for child 1
	var nextr2; // r (scale) reference for child 2
	
	// stores the refernce point and reference scale which get updated with each redraw of the page
	var xvar; // x
	var yvar; // y 
	var rvar; // the value of r for the current view (null means nothign to draw)
	
	// variables indicating if drawing is needed for this node or its children updated with each redraw of the page
	var dvar; // true if this or its children need to be drawn
	var gvar; // true if graphics elements in this node itself need to be drawn
	
	// flight and search data
	var searchin = 0;
	var startscore = 0; // gives this node a score for being the starting node
	var onroute = false;
	var targeted = false;
	var searchinpast = 0;
	var flysofarA = false;
	var flysofarB = false;
	
	// other data
	var npolyt = true; // true if node is NOT a polytomy
	var graphref = false; // true for one path of nodes through the tree, the IFIG is anchored on the node at the end of that path 
	this.inlabel = false; // tells if the node has primary and secondary labels to be plotted 
	this.insublabel = false; 
	this.linkclick = false; // tells if a link has been clicked

	this.phylogenetic_diversity = 0.0;
	
	// This part of the code initialises the mode from newick format
	var bracketscount = 0;
	var cut;
	var end;
	
	if (x.charAt(x.length-1) == ';')
	{
		x = x.substr(0,x.length-1);
	}
	
	if (x.charAt(0) == '(')
	{
		for (i = 0; i < x.length ; i++)
		{
			if (x.charAt(i) == '(')
			{
				bracketscount ++;
			}
			if (x.charAt(i) == ')')
			{
				bracketscount --;
			}
			if (x.charAt(i) == ',')
			{
				if (bracketscount == 1)
				{
					cut = i;
				}
			}
			if (bracketscount == 0)
			{
				end = i;
				i = x.length +1;
			}
		}
		
		var cut1 = x.substr(1,cut-1);
		var cut2 = x.substr(cut+1,end-cut-1);
		var cutname = x.substr(end+1,x.length-end);
		// this is an interior node with name 'cutname'
		// the two children are given by cut1 ad cut2
		
		var lengthcut = -1;
		for (i = 0; i < cutname.length ; i++)
		{
			if (cutname.charAt(i) == ':')
			{
				lengthcut = i;
			}
		}
		if (lengthcut == -1)
		{
			this.lengthbr = null;
		}
		else
		{
			this.lengthbr = parseFloat(cutname.substr(lengthcut+1,(cutname.length)-lengthcut));
			cutname = cutname.substr(0,lengthcut);
		}
		
		// at this stage cutname does not have the length data associated with it
		
		if ((cutname.length > 0)&&(cutname!=((parseFloat(cutname)).toString())))			
		{
			this.hasname2 = false;
			this.hasname1 = true;
			this.name2 = null;
			this.name1 = cutname;
		}
		else
		{
			this.hasname2 = false;
			this.hasname1 = false;
			this.name2 = null;
			this.name1 = null;
			this.cname = null;
		}
		
		// initialise children
		this.child1 = new midnode(cut1,this);
		this.child2 = new midnode(cut2,this);
		// initialise interior node variables
		this.richness_val = 0;
	}
	else
	{
		this.child1 = null;
		this.child2 = null;
		this.richness_val =0; // these richness values are sorted out later
		
		var lengthcut = -1;
		for (i = 0; i < x.length ; i++)
		{
			if (x.charAt(i) == ':')
			{
				lengthcut = i;
			}
		}
		if (lengthcut == -1)
		{
			this.lengthbr = null;
		}
		else
		{
			this.lengthbr = parseFloat(x.substr(lengthcut+1,(x.length)-lengthcut));
			x = x.substr(0,lengthcut);
		}
		
		if (x.length > 0)
		{
			lengthcut = -1;
			for (i = 0; i < x.length ; i++)
			{
				if (x.charAt(i) == '{')
				{
					lengthcut = i;
					i = x.length;
				}
			}
			if (lengthcut == -1)
			{
				// no metadata
				datahastraits = false;
			}
			else
			{
				// metadata

				/// ***** LEAF NODE SORT START

				this.cname = x.substr(lengthcut+1,(x.length)-lengthcut-2)
				x = x.substr(0,lengthcut);
				
				//*
				lengthcut = -1;
				for (i = 0; i < this.cname.length ; i++)
				{
					if (this.cname.charAt(i) == '_')
					{
						lengthcut = i;
						i = this.cname.length;
					}
				}
				if (lengthcut == -1)
				{
					// no conservationdata
					this.popstab = "U";
					this.redlist = "NE";
				}
				else
				{	
					this.redlist = this.cname.substr(lengthcut+1,(this.cname.length)-lengthcut-3);
					this.popstab = this.cname.substr((this.cname.length)-1,1);
					this.cname = this.cname.substr(0,lengthcut);
				}			
			}
			
			
			lengthcut = -1;
			for (i = 0; i < x.length ; i++)
			{
				if (x.charAt(i) == '_')
				{
					lengthcut = i;
					i = x.length;
				}
			}
			if (lengthcut == -1)
			{
				this.hasname2 = false;
				this.hasname1 = true;
				this.name2 = null;
				this.name1 = x;
			}
			else
			{
				this.hasname2 = true;
				this.hasname1 = true;
				this.name1 = x.substr(lengthcut+1,(x.length)-lengthcut-1);
				this.name2 =  x.substr(0,lengthcut);
			}
		}
		else
		{
			this.hasname2 = false;
			this.hasname1 = false;
			this.name2 = null;
			this.name1 = null;
			datahastraits = false;
		}
	}
}

midnode.prototype.extxt = function() // returns text for redlist status
{
	if (this.redlist)
	{
		return conconvert(this.redlist);
	}
	else
	{
		return ("Not Evaluated");
	}
}

midnode.prototype.poptxt = function() // returns text for redlist status
{
	if (this.popstab)
	{
		switch(this.popstab)
		{
			case "D":
			return ("decreasing");
			case "I":
			return ("increasing");
			case "S":
			return ("stable");
			case "U":
			{
				if ((this.redlist == "EX")||(this.redlist == "EW"))
				{
					return ("extinct");	
				}
				else
				{
					return ("stability unknown");
				}
			}
			default:
			if ((this.redlist == "EX")||(this.redlist == "EW"))
			{
				return ("extinct");	
			}
			else
			{
				return ("stability unknown");
			}
		}
		
	}
	else
	{
		if ((this.redlist == "EX")||(this.redlist == "EW"))
		{
			return ("extinct");	
		}
		else
		{
			return ("stability unknown");
		}
	}
}

function conconvert(casein)
{
	switch(casein)
	{
		case "EX":
		return ("Extinct");
		case "EW":
		return ("Extinct in the Wild");
		case "CR":
		return ("Critically Endangered");
		case "EN":
		return ("Endangered");
		case "VU":
		return ("Vulnerable");
		case "NT":
		return ("Near Threatened");
		case "LC":
		return ("Least Concern");
		case "DD":
		return ("Data Deficient");
		case "NE":
		return ("Not Evaluated");
		default:
		return ("Not Evaluated");
	}
}

function conconvert2(casein)
{
	switch(casein)
	{
		case "EX":
		return (0);
		case "EW":
		return (1);
		case "CR":
		return (2);
		case "EN":
		return (3);
		case "VU":
		return (4);
		case "NT":
		return (5);
		case "LC":
		return (6);
		case "DD":
		return (7);
		case "NE":
		return (8);
		default:
		return (9);
	}
}

// *****************************************************************************************
// *****************************************************************************************
// ******** there are no functions below this point that are designed to be edited *********
// *****************************************************************************************
// *****************************************************************************************

// this is the logic that draws the leaves and could be edited or added to with additional functions

function drawleaf1(x,y,r)
{
	context.beginPath();
	context.arc(x,y,r*(1-partl2*1.5),0,Math.PI*2,true);
	context.lineWidth = r*(partl2*3);
	context.stroke();
	context.fill();
}

function drawleaf2(x,y,r,angle)
{
	var tempsinpre = Math.sin(angle);
	var tempcospre = Math.cos(angle);
	var tempsin90pre = Math.sin(angle + Math.PI/2.0);
	var tempcos90pre = Math.cos(angle + Math.PI/2.0);
	
	var startx = x-r*(1-partl2*1)*tempcospre;
	var endx = x+r*(1-partl2*1)*tempcospre;
	var starty = y-r*(1-partl2*1)*tempsinpre;
	var endy = y+r*(1-partl2*1)*tempsinpre;
	var midy = (endy-starty)/3;
	var midx = (endx-startx)/3;
	
	context.beginPath();
	context.moveTo(startx,starty);
	context.bezierCurveTo(startx+midx+2*r/2.4*tempcos90pre,starty+midy+2*r/2.4*tempsin90pre,startx+2*midx+2*r/2.4*tempcos90pre,starty+2*midy+2*r/2.4*tempsin90pre,endx,endy);
	context.bezierCurveTo(startx+2*midx-2*r/2.4*tempcos90pre,starty+2*midy-2*r/2.4*tempsin90pre,startx+midx-2*r/2.4*tempcos90pre,starty+midy-2*r/2.4*tempsin90pre,startx,starty);
	context.lineWidth = r*(partl2*3);
	context.stroke();
	context.fill();
}

// SECTION 2: GLOBAL VARIABLE DECLARIATION

// display size variables - there are defaults but these values are automatically changed later
var widthres = 1000;
var heightres = 600;
var xmin = 0;
var xmax = widthres;
var ymin = 0;
var ymax = heightres;

var widthofcontrols = 920; 
var widthofcontrols2 = 750; 
var growthtimetot = 30; 
var widthofinfobar = 620;

var buttonoptions = 0;
// data and graphics variables
var context; // the graphics element
var myCanvas; // the canvas
var fulltree; // the full tree
var datahastraits = false; // if data has traits

// zoom and pan position variables
var ws = 1; // current zoom
var xp = widthres/2; // current x position
var yp = heightres;  // current y position
var wsinit; // used for comparison with ws to obtain zoom level
var calculating = false; // if in the process of calculating for zoom

// variables for mouse use
var mousehold = false;
var buttonhold = false;
var popupbox = false;
var tutorialmode = false;
var mouseX;
var mouseY; 
var oldyp; // old y position for moving
var oldxp; // old x position for moving

// growth functions
var timelim = -1; // used as a global variable by the growth function to store the current time limit
var timeinc; // used as a global variable by the growth function to store the time scaling factor
var t2; // second timing object for growth function
var growing = false; // if in the process of growth
var growingpause = false;

// flight functons
var flying = false; // if in the process of flying
var countdownB = 0;
var t; // timing object for flying

// search functions
var numhits;
var searchinparts = [];
var highlight_search = false;
var latin_search = false;
var common_search = true;
var trait_search = true;	

// variables indicating current preferences 
var infotype = 0; // for the info bar
var sensitivity = 0.8; // for mouse sensitivity
var threshold =2; // for the detail threshold

var mywindow;
var jsBridge;

// INITIALISERS

// this initialises the whole IFIG	
function onezoom_init(inputTreeNewickString)
{
  console.log(inputTreeNewickString);
	myCanvas = document.getElementById("onezoom_canvas");
	clearbuttons();
	buttonoptions = 0;
	
	context= myCanvas.getContext('2d'); // sort out the canvas element
	Resize_only();
	draw_loading();
	myCanvas.onmousedown = holdon;
	myCanvas.onmouseup = holdoff;
	myCanvas.onmouseout = holdoff;
	myCanvas.onmousemove = movemouse;
	if (myCanvas.addEventListener) 
	{
		myCanvas.addEventListener ("mousewheel", mousewheel, false);
		myCanvas.addEventListener ("DOMMouseScroll", mousewheel, false);
	}
	else 
	{
		if (myCanvas.attachEvent) 
		{
			myCanvas.attachEvent ("onmousewheel", mousewheel);
		}
	}
	setTimeout (function(){init2(inputTreeNewickString);},10);
}

function init2(inputTreeNewickString)
{
  console.log("init2:" + inputTreeNewickString);
	// sort out event listeners for zoom and pan
	readintree(inputTreeNewickString); // read in the tree and do all the necessary precalculations
  console.log("Read in XXL")
	Reset(); // set the canvas size and draw the IFIG initial view
}

// read in the tree data
function readintree(inputTreeNewickString)
{
	datahastraits = true;
	// read in information from text input
	var stringin = document.forms["myform"]["datain"].value;
	fulltree = null;
	if (stringin)
	{
		// if there is data inputed use this as the tree
		fulltree = new midnode(stringin);
	}
	else
	{
		// otherwise use embedded data set at top of file
		userdata(inputTreeNewickString);
	}
	if (!datahastraits)
	{
		colourtype = 2;
	}
	// calculate species richness at all nodes
	fulltree.richness_calc();
	if (datahastraits)
	{
	fulltree.concalc();
	}
	// check all names and find monophyletic genera groups
	fulltree.name_calc();
	// calculate ages
	fulltree.phylogeneticdiv_calc();
	fulltree.age_calc();
	// calculate labels
	fulltree.inlabel_calc();
	fulltree.insublabel_calc(1);
	// update fractal form and do all precalculations
	update_form();	
	// resize canvas to fit
	Resize();
	// centre view on IFIG 
	fulltree.setxyr3r(40,widthres-40,40,heightres-40);
	// store initial zoom level
	wsinit = ws;
}

// resize the canvas to fit the space
function Resize_only()
{
	widthres = 1024; // default
	heightres = 660; // default
	if (document.body && document.body.offsetWidth) {
		widthres = document.body.offsetWidth;
		winH = document.body.offsetHeight;
	}
	if (document.compatMode=='CSS1Compat' &&
		document.documentElement &&
		document.documentElement.offsetWidth ) {
		widthres = document.documentElement.offsetWidth;
		heightres = document.documentElement.offsetHeight;
	}
	if (window.innerWidth && window.innerHeight) {
		widthres = window.innerWidth;
		heightres = window.innerHeight;
	}
	// need to allow for space for buttons and border etc.
	heightres = heightres - 60;
	widthres = widthres - 30;
	if (buttonoptions != 0)
	{
		heightres = heightres - 40;
		if (widthres < widthofcontrols)
		{
			heightres = heightres - 27; // add space for two rows of buttons
			if (widthres < widthofcontrols/2)
			{
				heightres = heightres - 27; // add space for three rows of buttons
				if (widthres < widthofcontrols/3)
				{
					heightres = heightres - 27; // add space for four rows of buttons
				}
			}
		}
	}
	if (((infotype != 0 || growing || growingpause) && (buttonoptions ==0) ))
	{
		heightres -= 42 // add space for infobar if needed
		if (widthres < widthofinfobar)
		{
			heightres -= 42
		}
	}
	
	if (widthres < widthofcontrols2)
		{
			heightres = heightres - 27; // add space for two rows of buttons
			if (widthres < widthofcontrols2/2)
			{
				heightres = heightres - 27; // add space for three rows of buttons
				if (widthres < widthofcontrols2/3)
				{
					heightres = heightres - 27; // add space for four rows of buttons
				}
			}
		}
	// change size of canvas
	var myCanvas = document.getElementById("onezoom_canvas");
	myCanvas.width = widthres;
	myCanvas.height = heightres;
	// redraw canvas
}

function Resize()
{
	Resize_only();
	draw2();
}

// reset the search and view to its start position
function Reset()
{		
	growthtimetot = 30;
	threshold =2;
	if ((growing)||(growingpause))
	{
		clearTimeout(t2);
		draw2();
		timelim = -1;
		Resize();
		growing = false;
		growingpause = false;
		Resize();
	}
	tutorialmode = false;
	popupbox = false;
	calculating = false;
	clearTimeout(t);
	flying = false;
	clearTimeout(t2);
	performclear();
	timelim = -1;
	fulltree.deanchor();
	fulltree.graphref = true;
	fulltree.clearsearch();
	fulltree.clearlinks();
	fulltree.clearonroute();
	fulltree.setxyr3r(40,widthres-40,40,heightres-40);
	wsinit = ws;
	Resize();
}

// MOUSE CONTROL, PAN AND ZOOM

// if holding down left mouse button - prepare to pan
function holdon(event)
{
	popupbox = false;
	clearTimeout(t);
	flying = false;
	mouseY = event.clientY-myCanvas.offsetTop;
	mouseX = event.clientX-myCanvas.offsetLeft;
	fulltree.clearlinks();
	fulltree.links();
	if (fulltree.linkclick)
	{
		mousehold = false;
		buttonhold = true;
		calculating = true;
		draw2();
		calculating = false;
	}
	else
	{
		mousehold = true;
		oldyp = yp;
		oldxp = xp;
	}
}

// if releasing left mouse button
function holdoff()
{
	if (fulltree.linkclick)
	{
		// link out
		fulltree.wikilink();
	}
	fulltree.clearlinks();
	if (!popupbox)
	{
		draw2();
	}
	buttonhold = false;
	mousehold = false;
	calculating = false;
}

// mouse move, so if left button held redraw
function movemouse(event)
{
	if (mousehold)
	{
		yp = oldyp + (-mouseY+event.clientY -myCanvas.offsetTop);
		xp = oldxp + (-mouseX+event.clientX -myCanvas.offsetLeft);
		draw2();
	}
	else
	{
		if (!popupbox)
		{
			mouseY = event.clientY -myCanvas.offsetTop;
			mouseX = event.clientX -myCanvas.offsetLeft;
			calculating = true;
			fulltree.clearlinks();
			fulltree.links();
			draw2();
			calculating = false;
		}
	}
	
}	

// need to zoom in or out
function mousewheel(event)
{
	popupbox = false;
	if (!calculating)
	{
		clearTimeout(t);
		flying = false;
		if (!mousehold)
		{
			var delta = 0;
			if ('wheelDelta' in event) 
			{
				delta = event.wheelDelta;
			}
			else 
			{
				delta = -event.detail / 2;
			}
			
			mouseY = event.clientY -35;
			mouseX = event.clientX -10;
			
			if ((parseFloat(delta)) > 0.0)
			{
				calculating = true;
				zoomin(event)
			}
			else
			{
				calculating = true;
				zoomout(event)
			}
		}
		setTimeout('calcfalse()',1);
		// there is a tiny delay here to force redraw in all browsers when zooming a lot
	}
}

// handles the calculating flag
function calcfalse()
{
	calculating = false;
}

// zoom in function
function zoomin(event)
{
	clearTimeout(t);
	mouseY = event.clientY -myCanvas.offsetTop;
	mouseX = event.clientX -myCanvas.offsetLeft;
	flying = false;
	ws = ws/sensitivity;
	xp = mouseX + (xp-mouseX)/sensitivity;
	yp = mouseY + (yp-mouseY)/sensitivity;
	context.clearRect(0,0, widthres,heightres);
	draw2();
}

// zoom out function
function zoomout(event)
{
	mouseY = event.clientY -myCanvas.offsetTop;
	mouseX = event.clientX -myCanvas.offsetLeft;
	clearTimeout(t);
	flying = false;
	ws = ws*sensitivity;
	xp = mouseX + (xp-mouseX)*sensitivity;
	yp = mouseY + (yp-mouseY)*sensitivity;
	context.clearRect(0,0, widthres,heightres);
	draw2();		
}

// BUTTON CONTROL 

function clearbuttons()
{
	document.getElementById("growtxt").style.display = 'none';
	document.getElementById("viewtxt").style.display = 'none';
	document.getElementById("viewtxt2").style.display = 'none';
	document.getElementById("searchtxt").style.display = 'none';

	document.getElementById("detailincbutton").style.display = 'none';
	document.getElementById("detaildecbutton").style.display = 'none';
	document.getElementById("info button").style.display = 'none';
	document.getElementById("formbutton").style.display = 'none';
	document.getElementById("colourbutton").style.display = 'none';
	document.getElementById("polybutton").style.display = 'none';
	
	document.getElementById("revgbutton").style.display = 'none';
	document.getElementById("pausegbutton").style.display = 'none';
	document.getElementById("fastergbutton").style.display = 'none';
	document.getElementById("slowergbutton").style.display = 'none';
	document.getElementById("playgbutton").style.display = 'none';
	document.getElementById("startgbutton").style.display = 'none';
	document.getElementById("endgbutton").style.display = 'none';
	
	document.getElementById("searchtf").style.display = 'none';
	document.getElementById("searchbutton").style.display = 'none';
	document.getElementById("searchbutton2").style.display = 'none';
	document.getElementById("leapbutton").style.display = 'none';
	document.getElementById("flybutton").style.display = 'none';
	document.getElementById("latincheckbox").style.display = 'none';
	document.getElementById("latintxt").style.display = 'none';
	document.getElementById("commoncheckbox").style.display = 'none';
	document.getElementById("commontxt").style.display = 'none';
	document.getElementById("traitcheckbox").style.display = 'none';
	document.getElementById("traittxt").style.display = 'none';
	
	document.getElementById("datatxt").style.display = 'none';
	document.getElementById("datatxtin").style.display = 'none';
	document.getElementById("databutton").style.display = 'none';
	
}

function searchoptions()
{
	clearbuttons();
	if (buttonoptions == 1)
	{
		buttonoptions = 0;
	}
	else
	{
		buttonoptions = 1;
		document.getElementById("searchtxt").style.display = '';
		document.getElementById("searchtf").style.display = '';
		document.getElementById("searchbutton").style.display = '';
		document.getElementById("searchbutton2").style.display = '';
		document.getElementById("leapbutton").style.display = '';
		document.getElementById("flybutton").style.display = '';
		document.getElementById("latincheckbox").style.display = '';
		document.getElementById("latintxt").style.display = '';
		if (datahastraits)
		{
			document.getElementById("commoncheckbox").style.display = '';
			document.getElementById("commontxt").style.display = '';
			document.getElementById("traitcheckbox").style.display = '';
		document.getElementById("traittxt").style.display = '';
		}
	}
	Resize();
}

function growoptions()
{
	clearbuttons();
	if (buttonoptions == 2)
	{
		buttonoptions = 0;
	}
	else
	{
		buttonoptions = 2;
		document.getElementById("growtxt").style.display = '';
		document.getElementById("revgbutton").style.display = '';
		document.getElementById("pausegbutton").style.display = '';
		document.getElementById("fastergbutton").style.display = '';
		document.getElementById("slowergbutton").style.display = '';
		document.getElementById("playgbutton").style.display = '';
		document.getElementById("startgbutton").style.display = '';
		document.getElementById("endgbutton").style.display = '';
		if ((!growingpause) && (!growing))
		{
			growplay();
		}
	}
	Resize();
}

function viewoptions()
{
	clearbuttons();
	if (buttonoptions == 3)
	{
		buttonoptions = 0;
	}
	else
	{
		buttonoptions = 3;
		document.getElementById("viewtxt").style.display = '';
		document.getElementById("detailincbutton").style.display = '';
		document.getElementById("detaildecbutton").style.display = '';
		document.getElementById("info button").style.display = '';
		document.getElementById("formbutton").style.display = '';
		document.getElementById("colourbutton").style.display = '';
		document.getElementById("polybutton").style.display = '';
		if (infotype != 0)
		{
			document.getElementById("viewtxt2").style.display = '';
		}
	}
	Resize();
}

function dataoptions()
{
	clearbuttons();
	if (buttonoptions == 4)
	{
		buttonoptions = 0;
	}
	else
	{
		document.getElementById("datatxt").style.display = '';
		document.getElementById("datatxtin").style.display = '';
		document.getElementById("databutton").style.display = '';
		buttonoptions = 4;
	}
	Resize();
}

// change use of info display
function toggledisplay()
{
	if (infotype == 0)
	{
		widthofcontrols += 100;
		infotype = 3
		document.getElementById("viewtxt2").style.display = '';
	}
	else
	{
		if (infotype == 3)
		{
			infotype = 4
			document.getElementById("viewtxt2").style.display = '';
		}
		else
		{
			infotype = 0
			document.getElementById("viewtxt2").style.display = 'none';
			widthofcontrols -= 100;
		}	
	}
	Resize();
}	

// change level of detail in display
function detailup()
{
	if (threshold > 0.2)
	{
		threshold = threshold / 2.0;
	}
	draw2();
}

function detaildown()
{
	if (threshold < 10.0)
	{
		threshold = threshold*2.0;
	}
	draw2();
}

// change fractal form of display
function form_change()
{
	clearTimeout(t);
	flying = false;
	if (viewtype == 1)
	{
		viewtype = 2;
	}
	else
	{
		if (viewtype == 2)
		{
			viewtype = 3;
		}
		else
		{
			viewtype = 1;
		}
	}
	draw_loading();
	setTimeout('form_change2()',1);
}

function form_change2()
{
	update_form();
	Resize();
}

// change the way polytomies are displayed
function polyt_change()
{
	if (polytype == 0)
	{
		polytype = 1;
	}
	else
	{
		if (polytype == 1)
		{
			polytype = 2;
		}
		else
		{
			if (polytype == 2)
			{
				polytype = 3;
			}
			else
			{
				polytype = 0;
			}
		}
	}
	draw2();
}

// change colour scheme
function colour_change()
{
	if (colourtype == 1)
	{
		colourtype = 2;
	}
	else
	{
		if (colourtype == 2)
		{
			if (datahastraits)
			{
				colourtype = 3;
			}
			else
			{
				colourtype = 1;
			}
		}
		else
		{
			colourtype = 1;
		}
	}
	draw2();
}

// TEXT DRAWING TOOLS

// text tool
function autotext(initalic,texttodisp,textx,texty,textw,defpt)
{
	if (defpt > 1.5)
	{
		// draws text within a bounding width but only if possible with font size > 1
		// if possible uses the defpt font size and centres the text in the box
		// otherwise fills the box
		context.textBaseline = 'middle';
		context.textAlign = 'left';
		if (initalic)
		{
			context.font = 'italic ' + (defpt).toString() + 'px '+fonttype;
		}
		else
		{
			context.font = (defpt).toString() + 'px '+ fonttype;
		}
		var testw = context.measureText(texttodisp).width;
		if (testw > textw)
		{
			if ((defpt*textw/testw) > 1.5)
			{
				if (initalic)
				{
					context.font = 'italic ' + (defpt*textw/testw).toString() + 'px '+fonttype;
				}
				else
				{
					context.font = (defpt*textw/testw).toString() + 'px '+fonttype;
				}
				context.fillText  (texttodisp , textx - textw/2.0,texty);
			}
		}
		else
		{
			context.fillText  (texttodisp , textx - (testw)/2.0,texty);
		}
	}
}


function autotext2(initalic,texttodisp,textx,texty,textw,defpt)
{
	// x and y are the centres
	if (defpt >1.5)
	{
		// draws text within a bounding width but only if possible with font size > 1
		// if possible uses the defpt font size and centres the text in the box
		// otherwise fills the box
		context.textBaseline = 'middle';
		context.textAlign = 'center';
		if (initalic)
		{
			context.font = 'italic ' + (defpt).toString() + 'px '+fonttype;
		}
		else
		{
			context.font = (defpt).toString() + 'px '+ fonttype;
		}
					
		var centerpoint = (texttodisp.length)/2;
		var splitstr = texttodisp.split(" ");
		var print1 = " ";
		var print2 = " ";
		
		if (splitstr.length == 1)
		{
			context.fillText  (texttodisp , textx ,texty);
		}
		else
		{
			if (splitstr.length == 2)
			{
				print1  = (splitstr[0]);
				print2  = (splitstr[1]);
			}
			else
			{
				for (i = (splitstr.length -1) ; i >= 0 ; i--)
				{
					if ((print2.length)>centerpoint)
					{
						print1  = (" " + splitstr[i] + print1);
					}
					else
					{
						print2 = (" " + splitstr[i] + print2);
					}
				}
			}
			var testw = context.measureText(print2).width;
			if (testw < (context.measureText(print1).width))
			{
				testw = context.measureText(print1).width
			}
			if (testw > textw)
			{
				if ((defpt*textw/testw) > 1.5)
				{
					
					if (initalic)
					{
						context.font = 'italic ' + (defpt*textw/testw).toString() + 'px '+fonttype;
					}
					else
					{
						context.font = (defpt*textw/testw).toString() + 'px '+fonttype;
					}
					
					context.fillText  (print1 , textx ,texty-defpt*textw/testw/1.7);
					context.fillText  (print2 , textx ,texty+defpt*textw/testw/1.7);
				}
			}
			else
			{
				context.fillText  (print1 , textx ,texty-defpt/1.7);
				context.fillText  (print2 , textx ,texty+defpt/1.7);
			}
		}
	}
}

// POPUP BOX DRAWING
	
function AboutOZ()
{
	if (!popupbox)
	{
		
		if (tutorialmode)
		{
			tutorialmode = false;
			draw2();
			tutorialmode = true;
		}
		else
		{
			draw2();
		}
		popupbox = true;
		context.beginPath();
		context.lineWidth = 1;
		context.lineTo( myCanvas.width /6 , myCanvas.height *4/5 );
		context.lineTo( myCanvas.width /6, myCanvas.height /5);
		context.lineTo( myCanvas.width *5/6, myCanvas.height /5 );
		context.lineTo( myCanvas.width *5/6 , myCanvas.height *4/5 );
		context.fillStyle = 'rgba(0,0,0,0.85)';
		context.fill();
		context.fillStyle = 'rgb(255,255,255)';
		autotext(false,"OneZoom (TM) V1.0.360 (2012)" , myCanvas.width /2 , myCanvas.height *0.32 , myCanvas.width *0.6 , 20);
		autotext(false,"Please read the associated manuscript" , myCanvas.width /2 , myCanvas.height *0.37 , myCanvas.width *0.6 , 15);
		autotext(false,"\"OneZoom: A Fractal Explorer for the Tree of Life \"" , myCanvas.width /2 , myCanvas.height *0.42 , myCanvas.width *0.6 , 15);
		autotext(false,"written by J. Rosindell and L. J. Harmon" , myCanvas.width /2 , myCanvas.height *0.47 , myCanvas.width *0.6 , 15);
		autotext(false,"Concept and software by J. Rosindell, development by J. Rosindell and L. J. Harmon" , myCanvas.width /2 , myCanvas.height *0.56 , myCanvas.width *0.6 , 10);
		autotext(false,"Special thanks to Jonathan Eastman, James Foster, Custis Lisle, Ian Owens, William Pearse, Albert Phillimore and Andy Purvis" , myCanvas.width /2 , myCanvas.height *0.6 , myCanvas.width *0.6 , 10);
		autotext(false,"Data: The IUCN Red List of Threatened Species. Version 2012.1. <http://www.iucnredlist.org> and" , myCanvas.width /2 , myCanvas.height *0.64 , myCanvas.width *0.6 , 10);
		autotext(false,"\"The delayed rise of present-day mammals\" O.R.P. Bininda-Emonds  et.al. (2007) Nature 446, p.507" , myCanvas.width /2 , myCanvas.height *0.68 , myCanvas.width *0.6 , 10);
		autotext(false,"J. Rosindell is grateful to NERC for funding his research" , myCanvas.width /2 , myCanvas.height *0.72 , myCanvas.width *0.6 , 10);
	}
	else
	{
		popupbox = false;
		draw2();
	}
}

function LicenseOZ()
{
	if (!popupbox)
	{
		if (tutorialmode)
		{
			tutorialmode = false;
			draw2();
			tutorialmode = true;
		}
		else
		{
			draw2();
		}
		popupbox = true;
		context.beginPath();
		context.lineWidth = 1;
		context.lineTo( myCanvas.width /6 , myCanvas.height *4/5 );
		context.lineTo( myCanvas.width /6, myCanvas.height /5);
		context.lineTo( myCanvas.width *5/6, myCanvas.height /5 );
		context.lineTo( myCanvas.width *5/6 , myCanvas.height *4/5 );
		context.fillStyle = 'rgba(0,0,0,0.85)';
		context.fill();
		context.fillStyle = 'rgb(255,255,255)';
		
		autotext(false,"OneZoom version 1.0.360 (2012)" , myCanvas.width /2 , myCanvas.height *0.25 , myCanvas.width *0.6 , 15);
		autotext(false,"Copyright (c) 2012 owned by James Rosindell and Imperial College, London" , myCanvas.width /2 , myCanvas.height *0.35 , myCanvas.width *0.6 , 10);
		autotext(false,"URL: www.onezoom.org - please refer to website for updates" , myCanvas.width /2 , myCanvas.height *0.39 , myCanvas.width *0.6 , 10);
		autotext(false,"Citation: \"OneZoom: A Fractal Explorer for the Tree of Life\" PLoS Biology (2012) Rosindell, J. and Harmon, L. J." , myCanvas.width /2 , myCanvas.height *0.43 , myCanvas.width *0.6 , 10);
		autotext(false,"All rights reserved. By using OneZoom, you agree to cite the associated paper in any resulting publications." , myCanvas.width /2 , myCanvas.height *0.47 , myCanvas.width *0.6 , 10);
		autotext(false,"Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\")," , myCanvas.width /2 , myCanvas.height *0.51 , myCanvas.width *0.6 , 10);
		autotext(false,"to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense," , myCanvas.width /2 , myCanvas.height *0.55 , myCanvas.width *0.6 , 10);
		autotext(false,"and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:" , myCanvas.width /2 , myCanvas.height *0.59 , myCanvas.width *0.6 , 10);
		autotext(false,"The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software." , myCanvas.width /2 , myCanvas.height *0.63 , myCanvas.width *0.6 , 10);
		autotext(false,"THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY," , myCanvas.width /2 , myCanvas.height *0.67 , myCanvas.width *0.6 , 10);
		autotext(false,"FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY," , myCanvas.width /2 , myCanvas.height *0.71 , myCanvas.width *0.6 , 10);
		autotext(false,"WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE." , myCanvas.width /2 , myCanvas.height *0.75 , myCanvas.width *0.6 , 10);
	}
	else
	{
		popupbox = false;
		draw2();
	}
}

function tutorialstart()
{
	if (tutorialmode)
	{
		tutorialmode = false;
		draw2();
	}
	else
	{
		tutorialmode = true;
		draw2();
	}
}

// DRAWING ROUTINES

function infobar()
{
	document.getElementById("textout").innerHTML = '';
	if (growing || growingpause || (infotype != 0)|| buttonoptions != 0)
	{
		document.getElementById("textout").style.display = '';
	}
	else
	{
		document.getElementById("textout").style.display = 'none';
	}
	
	var toalter = "textout";
	if (buttonoptions ==3)
	{
		toalter = "viewtxt2";
	}
	
	
	if (buttonoptions == 3 || buttonoptions == 0)
	{
	if (infotype == 3)
	{
		var multret = ws/wsinit/fulltree.mult();
		//multret = Math.log(multret)/Math.log(10);
		
		if (multret<2500)
		{
			document.getElementById(toalter).innerHTML= ('<FONT COLOR="FFFFFF" >Current zoom level is ' + (Math.round(multret*10.0)/10.0).toString() + ' times magnification </FONT> ');
		}
		else
		{
			if (multret<1500000)
			{
				document.getElementById(toalter).innerHTML= ('<FONT COLOR="FFFFFF" >Current zoom level is ' + (Math.round(multret/1000.0)).toString() + ' thousand times magnification </FONT> ');
			}
			else
			{
				document.getElementById(toalter).innerHTML= ('<FONT COLOR="FFFFFF" >Current zoom level is ' + (Math.round(multret/100000.0)/10.0).toString() + ' million times magnification </FONT> ');
			}
			
		}
		
	}
	else
	{
		if (infotype == 4)
		{
			var multret = ws/wsinit/fulltree.mult();
			var mret = multret*widthres/8661.4;
			if (mret<1.5)
			{
				document.getElementById(toalter).innerHTML= ('<FONT COLOR="FFFFFF" >The complete image now measures at least ' + (Math.round(mret*1000.0)/10.0).toString() + ' Centimeters across </FONT>');
			}
			else
			{
				if (mret>1500)
				{
					document.getElementById(toalter).innerHTML= ('<FONT COLOR="FFFFFF" >The complete image now measures at least ' + (Math.round(mret/100)/10.0).toString() + ' Kilometers across </FONT>');
				}
				else
				{
					document.getElementById(toalter).innerHTML= ('<FONT COLOR="FFFFFF" >The complete image now measures at least ' + (Math.round(mret*10.0))/10.0.toString() + ' Meters across </FONT>');
				}
				
			}
			
		}
		else
		{

			document.getElementById("viewtxt2").style.display = 'none';
		}
	}
	}
	
		toalter = "growtxt";
	if (buttonoptions != 2)
	{
		toalter = "textout";
	}
	
	if (buttonoptions == 2 || buttonoptions == 0)
	{
		if ((growingpause || growing))
		{
		if (timelim >= 0 )
		{
			if (timelim >10)
			{
				document.getElementById(toalter).innerHTML = '<FONT COLOR="FFFFFF" >' + (Math.round(timelim*10)/10.0).toString() + ' Million years ago - ' + gpmapper(timelim) + ' Period </FONT>';
			}
			else
			{
				if (timelim >1)
				{
					document.getElementById(toalter).innerHTML =  '<FONT COLOR="FFFFFF" >' + (Math.round(timelim*100)/100.0).toString() + ' Million years ago - ' + gpmapper(timelim) + ' Period </FONT>';
				}
				else
				{
					document.getElementById(toalter).innerHTML =  '<FONT COLOR="FFFFFF" >' + (Math.round(timelim*10000)/10.0).toString() + ' Thousand years ago - ' + gpmapper(timelim) + ' Period </FONT>';
				}
			}
			if (growingpause)
			{
				document.getElementById(toalter).innerHTML += '<FONT COLOR="FFFFFF" >  (paused) </FONT>';
			}
	
		}
		}
		else
		{
			if (buttonoptions == 2 )
			{
				document.getElementById("growtxt").innerHTML = '<FONT COLOR="FFFFFF" > Present day </FONT>';
			}
		}
	}
}

function draw2()
{
	fulltree.drawreg(xp,yp,220*ws);
	if ((((ws > 100)||(ws < 0.01))&&(!mousehold))) // possibly change these values
	{
		fulltree.reanchor();
		fulltree.drawreg(xp,yp,220*ws);
	}
	if (backgroundcolor)
	{
		context.fillStyle = backgroundcolor;
		context.fillRect(0,0,widthres,heightres);
	}
	else
	{
		context.clearRect(0,0,widthres,heightres);
	}
	fulltree.draw();
	context.beginPath();
	context.lineWidth = 1;
	context.strokeStyle = outlineboxcolor;
	context.moveTo( 0 , 0 );
	var myCanvas = document.getElementById("onezoom_canvas");
	context.lineTo( myCanvas.width , 0 );
	context.lineTo( myCanvas.width , myCanvas.height );
	context.lineTo( 0 , myCanvas.height );
	context.lineTo( 0 , 0 );
	context.stroke();
	infobar();
	if (tutorialmode)
	{
		context.beginPath();
		context.lineWidth = 1;
		context.lineTo( myCanvas.width /6 , myCanvas.height *4/5 );
		context.lineTo( myCanvas.width /6, myCanvas.height /5);
		context.lineTo( myCanvas.width *5/6, myCanvas.height /5 );
		context.lineTo( myCanvas.width *5/6 , myCanvas.height *4/5 );
		context.fillStyle = 'rgba(0,0,0,0.85)';
		context.fill();
		context.fillStyle = 'rgb(255,255,255)';
		autotext(false,"OneZoom Tutorial" , myCanvas.width /2 , myCanvas.height *0.25 , myCanvas.width *0.6 , 22);
		autotext(false,"To exit the tutorial mode, press the 'Tutorial' button again, or press the 'Reset' button" , myCanvas.width /2 , myCanvas.height *0.35 , myCanvas.width *0.6 , 15);
		autotext(false,"To zoom in scroll up, to zoom out scroll down" , myCanvas.width /2 , myCanvas.height *0.39 , myCanvas.width *0.6 , 15);
		autotext(false,"To move, press and hold the left mouse button, then move the mouse" , myCanvas.width /2 , myCanvas.height *0.43 , myCanvas.width *0.6 , 15);
		autotext(false,"If you get lost and want to go back to the base of the tree press the 'Reset' button" , myCanvas.width /2 , myCanvas.height *0.47 , myCanvas.width *0.6 , 15);
		autotext(false,"The 'Search' button will bring up a panel of controls to allow searching of the tree" , myCanvas.width /2 , myCanvas.height *0.51 , myCanvas.width *0.6 , 15);
		autotext(false,"The 'Grow' button will allow you to see an animation of the tree growing" , myCanvas.width /2 , myCanvas.height *0.55 , myCanvas.width *0.6 , 15);
		autotext(false,"The 'Options' button allows you to change the look and colors of the tree" , myCanvas.width /2 , myCanvas.height *0.59 , myCanvas.width *0.6 , 15);
		autotext(false,"The 'Data' button allows you input your own data" , myCanvas.width /2 , myCanvas.height *0.63 , myCanvas.width *0.6 , 15);
		autotext(false,"The 'More' button takes you to the OneZoom website for updates and more trees" , myCanvas.width /2 , myCanvas.height *0.67 , myCanvas.width *0.6 , 15);
		autotext(false,"The 'License' button explains terms of use" , myCanvas.width /2 , myCanvas.height *0.75 , myCanvas.width *0.6 , 15);
		autotext(false,"The 'About' button gives production credits and version information" , myCanvas.width /2 , myCanvas.height *0.71 , myCanvas.width *0.6 , 15);
	}	
}

function Link2OZ()
{
	jsBridge.openURL("http://www.OneZoom.org");
}

function draw_loading()
{

	infobar();
	Resize_only();
	if (backgroundcolor)
	{
		context.fillStyle = backgroundcolor;
		context.fillRect(0,0,widthres,heightres);
	}
	else
	{
		context.clearRect(0,0,widthres,heightres);
	}
	context.beginPath();
	context.lineWidth = 1;
	context.strokeStyle = outlineboxcolor;
	context.moveTo( 0 , 0 );
	var myCanvas = document.getElementById("onezoom_canvas");
	context.lineTo( myCanvas.width , 0 );
	context.lineTo( myCanvas.width , myCanvas.height );
	context.lineTo( 0 , myCanvas.height );
	context.lineTo( 0 , 0 );
	context.stroke();

	context.beginPath();
	context.textBaseline = 'middle';
	context.textAlign = 'left';
	
	context.fillStyle = 'rgb(0,0,50)';
	context.font = '50px sans-serif';
	context.textAlign = 'center';
	context.fillText  ('Loading', widthres/2,heightres/2, widthres/2);

	return true;

}

// SORTING OUT THE LINKS TO OUTSIDE THE PAGE

midnode.prototype.links = function()
{
	var x ;
	var y ;
	var r ;
	if(this.dvar)
	{
		if (this.rvar)
		{
			var x = this.xvar;
			var y = this.yvar;
			var r = this.rvar;
		}
		if ((this.child1)&&(this.lengthbr > timelim))
		{
			if ((this.child1.links())||(this.child2.links()))
			{

					this.linkclick = true;
			}
		}
		
		var temp_twidth = (r*partc-r*partl2)*Twidth;
		var temp_theight = (r*partc-r*partl2)*Tsize/2.0;
		var temp_theight_2 = (r*partc-r*partl2)*Tsize/3.0;
		
		
		if (this.lengthbr > timelim)
		{
			if (this.gvar)
			{
				if (!(this.richness_val > 1))
				{
					// we are checking a leaf
					if ( (r*leafmult) > threshold*10)
					{
						if (this.leaflink(x,y,r,leafmult,partc,partl2,Twidth,Tsize))
						{

								this.linkclick = true;

						}
					}	
				}
				else
				{
					if ((this.npolyt)||(polytype == 3))
					{								
						if ( r > threshold*7)
						{
							if ((this.inlabel == true)&&((this.name2) != null))
							{
								var linkpos = 0;
								if ((this.npolyt)||(polytype != 2))
								{
									if ((highlight_search)&&(this.searchin > 0))
									{
										linkpos = temp_theight_2*0.45;
									}
								}
								if ( r > threshold*100)
								{
									if ((      ((mouseX-(x+r*this.arcx+linkpos))*(mouseX-(x+r*this.arcx+linkpos)))+  ((mouseY-(y+r*this.arcy-temp_theight_2*1.95))*(mouseY-(y+r*this.arcy-temp_theight_2*1.95)))    ) <= ((temp_theight*0.12)*(temp_theight*0.12)))
									{
										this.linkclick = true;
									}
								}
							}
						}
					}
				}
			}
		}
		if (this.lengthbr <= timelim)
		{
			if (!(this.richness_val > 1))
			{
				if ( (r*leafmult) > threshold*10)
				{
					if(this.leaflink(x,y,r,leafmult,partc,partl2,Twidth,Tsize))
					{

							this.linkclick = true;

					}
				}	
			}
		}
	}

	return this.linkclick;

}

midnode.prototype.leaflink = function(x,y,r,leafmult,partc,partl2,Twidth,Tsize)
{
	if ( r > threshold*6)
	{
		var temp_twidth = (r*leafmult*partc-r*leafmult*partl2)*Twidth;
		var temp_theight = ((r*leafmult*partc-r*leafmult*partl2)*Tsize/3.0);
		if (temp_theight*0.2 > threshold/2.5)
		{
			if (((mouseX-(x+r*this.arcx))*(mouseX-(x+r*this.arcx)))+((mouseY-(y+r*this.arcy-temp_theight*1.75))*(mouseY-(y+r*this.arcy-temp_theight*1.75))) <= ((temp_theight*0.2)*(temp_theight*0.2)))
			{
				this.linkclick = true;
			}
		}
	}
	return this.linkclick;
}

midnode.prototype.clearlinks = function()
{
	this.linkclick = false;
	if (this.child1)
	{
		this.child1.clearlinks();
		this.child2.clearlinks();	
	}
}

midnode.prototype.wikilink = function()
{
	if (this.linkclick)
	{
		if (this.child1)
		{
			if (this.child1.linkclick)
			{
				this.child1.wikilink();
			}
			else
			{
				if (this.child2.linkclick)
				{
					this.child2.wikilink();	
				}
				else
				{
					jsBridge.openURL("http://en.wikipedia.org/wiki/" + this.name2.toLowerCase());
				}
			}
		}
		else
		{
			jsBridge.openURL("http://en.wikipedia.org/wiki/" + this.name2 + "_" + this.name1);
		}
	}
}

// FRACTAL FORM ALGORITHMS AND PRECALCULATIONS

// variables that were used for all fractal forms
var partc = 0.4;
var partcint = 0.165;
var partl1 = 0.55; // size of line
var partl2 = 0.1;
var ratio1 = 0.77; // size of larger branch
var ratio2 = 0.47; // size of smaller branch
var Tsize = 1.1;
var Twidth = 1;
var Psize = 0.70
var leafmult = 3.2;
var posmult = leafmult -2;

midnode.prototype.precalc = function(x,y,r,angle)
{
	this.arca = angle;
	var tempsinpre = Math.sin(angle);
	var tempcospre = Math.cos(angle);
	var tempsin90pre = Math.sin(angle + Math.PI/2.0);
	var tempcos90pre = Math.cos(angle + Math.PI/2.0);
	var atanpre;
	var atanpowpre;
	
	if (this.child1)
	{
		atanpre = Math.atan2((this.child1).richness_val,(this.child2).richness_val);
		atanpowpre = Math.atan2(Math.pow((this.child1).richness_val,0.5),Math.pow(((this.child2).richness_val),0.5));
	}
	
	var thisangleleft = 0.46;
	var thisangleright = 0.22;
	var thisratio1 = 1/1.3;;
	var thisratio2 = 1/2.25;
	
	var tempsin2 = Math.sin(angle + Math.PI*thisangleright);
	var tempcos2 = Math.cos(angle + Math.PI*thisangleright);
	var tempsin3 = Math.sin(angle - Math.PI*thisangleleft);
	var tempcos3 = Math.cos(angle - Math.PI*thisangleleft);
	
	if (this.child1)
	{
		
		if ((this.child1.richness_val) >= (this.child2.richness_val))
		{
			
			this.nextr1 = thisratio1; // r (scale) reference for child 1
			this.nextr2 = thisratio2; // r (scale) reference for child 2
			
			(this.child1).bezsx = -(0.3)*(tempcospre)/thisratio1;
			(this.child1).bezsy = -(0.3)*(tempsinpre)/thisratio1;
			(this.child1).bezex = tempcos2;
			(this.child1).bezey = tempsin2;
			(this.child1).bezc1x = -0.3*(tempcospre)/thisratio1;
			(this.child1).bezc1y = -0.3*(tempsinpre)/thisratio1;
			(this.child1).bezc2x = 0.15*(tempcospre)/thisratio1;
			(this.child1).bezc2y = 0.15*(tempsinpre)/thisratio1;
			(this.child1).bezr = partl1;
			
			(this.child2).bezsx = -(0.3)*(tempcospre)/thisratio2;
			(this.child2).bezsy = -(0.3)*(tempsinpre)/thisratio2;
			(this.child2).bezex = tempcos3;
			(this.child2).bezey = tempsin3;
			(this.child2).bezc1x = 0.1*(tempcospre)/thisratio2;
			(this.child2).bezc1y = 0.1*(tempsinpre)/thisratio2;
			(this.child2).bezc2x = 0.9*tempcos3;
			(this.child2).bezc2y = 0.9*tempsin3;
			(this.child2).bezr = partl1;
			
			this.nextx1 = (1.3*Math.cos(angle))+(((this.bezr)-(partl1*thisratio1))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty1 = (1.3*Math.sin(angle))+(((this.bezr)-(partl1*thisratio1))/2.0)*tempsin90pre; // y reference point for both children
			this.nextx2 = (1.3*Math.cos(angle))-(((this.bezr)-(partl1*thisratio2))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty2 = (1.3*Math.sin(angle))-(((this.bezr)-(partl1*thisratio2))/2.0)*tempsin90pre; // y reference point for both children
		}
		else
		{
			this.nextr2 = thisratio1; // r (scale) reference for child 1
			this.nextr1 = thisratio2; // r (scale) reference for child 2
			
			(this.child2).bezsx = -(0.3)*(tempcospre)/thisratio1;
			(this.child2).bezsy = -(0.3)*(tempsinpre)/thisratio1;
			(this.child2).bezex = tempcos2;
			(this.child2).bezey = tempsin2;
			(this.child2).bezc1x = -0.2*(tempcospre)/thisratio1;
			(this.child2).bezc1y = -0.2*(tempsinpre)/thisratio1;
			(this.child2).bezc2x = 0.15*(tempcospre)/thisratio1;
			(this.child2).bezc2y = 0.15*(tempsinpre)/thisratio1;
			(this.child2).bezr = partl1;
			
			(this.child1).bezsx = -(0.3)*(tempcospre)/thisratio2;
			(this.child1).bezsy = -(0.3)*(tempsinpre)/thisratio2;
			(this.child1).bezex = tempcos3;
			(this.child1).bezey = tempsin3;
			(this.child1).bezc1x = 0.1*(tempcospre)/thisratio2;
			(this.child1).bezc1y = 0.1*(tempsinpre)/thisratio2;
			(this.child1).bezc2x = 0.9*tempcos3;
			(this.child1).bezc2y = 0.9*tempsin3;
			(this.child1).bezr = partl1;
			
			this.nextx2 = (1.3*Math.cos(angle))+(((this.bezr)-(partl1*thisratio1))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty2 = (1.3*Math.sin(angle))+(((this.bezr)-(partl1*thisratio1))/2.0)*tempsin90pre; // y reference point for both children
			this.nextx1 = (1.3*Math.cos(angle))-(((this.bezr)-(partl1*thisratio2))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty1 = (1.3*Math.sin(angle))-(((this.bezr)-(partl1*thisratio2))/2.0)*tempsin90pre; // y reference point for both children
		}
		
		this.arcx = this.bezex;
		this.arcy = this.bezey;
		this.arcr = (this.bezr)/2;
		
		if (this.child1)
		{
			if ((this.child1.richness_val) >= (this.child2.richness_val))
			{
				this.child1.precalc (x+((r)*(this.nextx1)),y+(r)*(this.nexty1),r*thisratio1,angle + Math.PI*thisangleright);
				this.child2.precalc (x+((r)*(this.nextx2)),y+(r)*(this.nexty2),r*thisratio2,angle - Math.PI*thisangleleft);
			}
			else
			{
				this.child2.precalc (x+((r)*(this.nextx2)),y+(r)*(this.nexty2),r*thisratio1,angle + Math.PI*thisangleright);
				this.child1.precalc (x+((r)*(this.nextx1)),y+(r)*(this.nexty1),r*thisratio2,angle - Math.PI*thisangleleft);
			}
		}
	}
	else
	{
		this.arcx = this.bezex+posmult*(tempcospre);
		this.arcy = this.bezey+posmult*(tempsinpre);
		this.arcr = leafmult*partc;
	}
	
}


midnode.prototype.precalc2 = function(x,y,r,angle)
{
	this.arca = angle;
	var tempsinpre = Math.sin(angle);
	var tempcospre = Math.cos(angle);
	var tempsin90pre = Math.sin(angle + Math.PI/2.0);
	var tempcos90pre = Math.cos(angle + Math.PI/2.0);
	var atanpre;
	var atanpowpre;
	
	if (this.child1)
	{
		atanpre = Math.atan2((this.child1).richness_val,(this.child2).richness_val);
		atanpowpre = Math.atan2(Math.pow((this.child1).richness_val,0.5),Math.pow(((this.child2).richness_val),0.5));
	}
	
	var thisangleleft = 0.5;
	var thisangleright = 0.2;
	var thisratio1 = ratio1;
	var thisratio2 = ratio2;
	var thislinewidth1;
	var thislinewidth2;
	if ((this.richness_val > 1)&&((this.child1)&&(this.child2)))
	{
		if ((this.child1.richness_val) >= (this.child2.richness_val))
		{
			thisangleright = 0.45-(atanpre)/Math.PI/0.5*0.449;
			thisangleleft = 0.45-(0.5-(atanpre)/Math.PI)/0.5*0.449;
			thisratio1 = 0.3+(atanpowpre)/Math.PI/0.5*0.5;
			thisratio2 = 0.3+(0.5-(atanpowpre)/Math.PI)/0.5*0.5;
		}
		else
		{
			thisangleleft = 0.45-(atanpre)/Math.PI/0.5*0.449;
			thisangleright = 0.45-(0.5-(atanpre)/Math.PI)/0.5*0.449;
			thisratio2 = 0.3+(atanpowpre)/Math.PI/0.5*0.5;
			thisratio1 = 0.3+(0.5-(atanpowpre)/Math.PI)/0.5*0.5;
		}
	}
	
	if (this.child1)
	{
		thislinewidth1 = (this.child1.richness_val)/((this.child1.richness_val)+(this.child2.richness_val));
		thislinewidth2 = (this.child2.richness_val)/((this.child1.richness_val)+(this.child2.richness_val));
	}
	
	var tempsin2 = Math.sin(angle + Math.PI*thisangleright);
	var tempcos2 = Math.cos(angle + Math.PI*thisangleright);
	var tempsin3 = Math.sin(angle - Math.PI*thisangleleft);
	var tempcos3 = Math.cos(angle - Math.PI*thisangleleft);
	
	if (this.child1)
	{
		if ((this.child1.richness_val) >= (this.child2.richness_val))
		{
			this.nextr1 = thisratio1; // r (scale) reference for child 1
			this.nextr2 = thisratio2; // r (scale) reference for child 2
			
			(this.child1).bezsx = -(0.3)*(tempcospre)/thisratio1;
			(this.child1).bezsy = -(0.3)*(tempsinpre)/thisratio1;
			(this.child1).bezex = tempcos2;
			(this.child1).bezey = tempsin2;
			(this.child1).bezc1x = 0;
			(this.child1).bezc1y = 0;
			(this.child1).bezc2x = 0.9*tempcos2;
			(this.child1).bezc2y = 0.9*tempsin2;
			(this.child1).bezr = partl1;
			
			(this.child2).bezsx = -(0.3)*(tempcospre)/thisratio2;
			(this.child2).bezsy = -(0.3)*(tempsinpre)/thisratio2;
			(this.child2).bezex = tempcos3;
			(this.child2).bezey = tempsin3;
			(this.child2).bezc1x = 0;
			(this.child2).bezc1y = 0;
			(this.child2).bezc2x = 0.3*tempcos3;
			(this.child2).bezc2y = 0.3*tempsin3;
			(this.child2).bezr = partl1;
			
			this.nextx1 = (1.3*Math.cos(angle))+(((this.bezr)-(partl1*thisratio1))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty1 = (1.3*Math.sin(angle))+(((this.bezr)-(partl1*thisratio1))/2.0)*tempsin90pre; // y reference point for both children
			this.nextx2 = (1.3*Math.cos(angle))-(((this.bezr)-(partl1*thisratio2))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty2 = (1.3*Math.sin(angle))-(((this.bezr)-(partl1*thisratio2))/2.0)*tempsin90pre; // y reference point for both children
		}
		else
		{
			this.nextr2 = thisratio1; // r (scale) reference for child 1
			this.nextr1 = thisratio2; // r (scale) reference for child 2
			
			(this.child2).bezsx = -(0.3)*(tempcospre)/thisratio1;
			(this.child2).bezsy = -(0.3)*(tempsinpre)/thisratio1;
			(this.child2).bezex = tempcos2;
			(this.child2).bezey = tempsin2;
			(this.child2).bezc1x = 0;
			(this.child2).bezc1y = 0;
			(this.child2).bezc2x = 0.9*tempcos2;
			(this.child2).bezc2y = 0.9*tempsin2;
			(this.child2).bezr = partl1;
			
			(this.child1).bezsx = -(0.3)*(tempcospre)/thisratio2;
			(this.child1).bezsy = -(0.3)*(tempsinpre)/thisratio2;
			(this.child1).bezex = tempcos3;
			(this.child1).bezey = tempsin3;
			(this.child1).bezc1x = 0;
			(this.child1).bezc1y = 0;
			(this.child1).bezc2x = 0.9*tempcos3;
			(this.child1).bezc2y = 0.9*tempsin3;
			(this.child1).bezr = partl1;
			
			this.nextx2 = (1.3*Math.cos(angle))+(((this.bezr)-(partl1*thisratio1))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty2 = (1.3*Math.sin(angle))+(((this.bezr)-(partl1*thisratio1))/2.0)*tempsin90pre; // y reference point for both children
			this.nextx1 = (1.3*Math.cos(angle))-(((this.bezr)-(partl1*thisratio2))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty1 = (1.3*Math.sin(angle))-(((this.bezr)-(partl1*thisratio2))/2.0)*tempsin90pre; // y reference point for both children
		}
		
		this.arcx = this.bezex;
		this.arcy = this.bezey;
		this.arcr = (this.bezr)/2;
		
		if (this.child1)
		{
			if ((this.child1.richness_val) >= (this.child2.richness_val))
			{
				this.child1.precalc2 (x+((r)*(this.nextx1)),y+(r)*(this.nexty1),r*thisratio1,angle + Math.PI*thisangleright);
				this.child2.precalc2 (x+((r)*(this.nextx2)),y+(r)*(this.nexty2),r*thisratio2,angle - Math.PI*thisangleleft);
			}
			else
			{
				this.child2.precalc2 (x+((r)*(this.nextx2)),y+(r)*(this.nexty2),r*thisratio1,angle + Math.PI*thisangleright);
				this.child1.precalc2 (x+((r)*(this.nextx1)),y+(r)*(this.nexty1),r*thisratio2,angle - Math.PI*thisangleleft);
			}
		}
	}
	else
	{
		this.arcx = this.bezex+posmult*(tempcospre);
		this.arcy = this.bezey+posmult*(tempsinpre);
		this.arcr = leafmult*partc;
	}
	
}

midnode.prototype.precalc3 = function(x,y,r,angle,dir)
{
	this.arca = angle;
	var tempsinpre = Math.sin(angle);
	var tempcospre = Math.cos(angle);
	var tempsin90pre = Math.sin(angle + Math.PI/2.0);
	var tempcos90pre = Math.cos(angle + Math.PI/2.0);
	var atanpre;
	var atanpowpre;
	
	var thisangleleft = 0.2;
	var thisangleright = 0.1;
	var thisratio1 = 0.85;
	var thisratio2 = 0.42;
	var child1right = false;
	
	if (!dir)
	{
		var thisangleleft = 0.1;
		var thisangleright = 0.2;
		var thisratio1 = 0.42;
		var thisratio2 = 0.85;
		if (this.child1)
		{
			if ((this.child1.richness_val) < (this.child2.richness_val))
			{
				child1right = true;
			}
		}
	}
	else
	{
		if (this.child1)
		{
			if ((this.child1.richness_val) >= (this.child2.richness_val))
			{
				child1right = true;
			}
		}
	}
	
	var partl1a = partl1;
	var partl1b = partl1;
	var tempsin2 = Math.sin(angle + Math.PI*thisangleright);
	var tempcos2 = Math.cos(angle + Math.PI*thisangleright);
	var tempsin3 = Math.sin(angle - Math.PI*thisangleleft);
	var tempcos3 = Math.cos(angle - Math.PI*thisangleleft);
	
	if (this.child1)
	{
		
		if (child1right)
		{
			
			this.nextr1 = thisratio1; // r (scale) reference for child 1
			this.nextr2 = thisratio2; // r (scale) reference for child 2
			
			(this.child1).bezsx = -(0.3)*(tempcospre)/thisratio1;
			(this.child1).bezsy = -(0.3)*(tempsinpre)/thisratio1;
			(this.child1).bezex = tempcos2;
			(this.child1).bezey = tempsin2;
			(this.child1).bezc1x = -0.3*(tempcospre)/thisratio1;
			(this.child1).bezc1y = -0.3*(tempsinpre)/thisratio1;
			(this.child1).bezc2x = 0.15*(tempcospre)/thisratio1;
			(this.child1).bezc2y = 0.15*(tempsinpre)/thisratio1;
			(this.child1).bezr = partl1;
			
			(this.child2).bezsx = -(0.3)*(tempcospre)/thisratio2;
			(this.child2).bezsy = -(0.3)*(tempsinpre)/thisratio2;
			(this.child2).bezex = tempcos3;
			(this.child2).bezey = tempsin3;
			(this.child2).bezc1x = 0.1*(tempcospre)/thisratio2;
			(this.child2).bezc1y = 0.1*(tempsinpre)/thisratio2;
			(this.child2).bezc2x = 0.9*tempcos3;
			(this.child2).bezc2y = 0.9*tempsin3;
			(this.child2).bezr = partl1;
			
			this.nextx1 = (1.3*Math.cos(angle))+(((this.bezr)-(partl1a*thisratio1))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty1 = (1.3*Math.sin(angle))+(((this.bezr)-(partl1a*thisratio1))/2.0)*tempsin90pre; // y reference point for both children
			this.nextx2 = (1.3*Math.cos(angle))-(((this.bezr)-(partl1b*thisratio2))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty2 = (1.3*Math.sin(angle))-(((this.bezr)-(partl1b*thisratio2))/2.0)*tempsin90pre; // y reference point for both children
		}
		else
		{
			this.nextr2 = thisratio1; // r (scale) reference for child 1
			this.nextr1 = thisratio2; // r (scale) reference for child 2
			
			(this.child2).bezsx = -(0.3)*(tempcospre)/thisratio1;
			(this.child2).bezsy = -(0.3)*(tempsinpre)/thisratio1;
			(this.child2).bezex = tempcos2;
			(this.child2).bezey = tempsin2;
			(this.child2).bezc1x = -0.2*(tempcospre)/thisratio1;
			(this.child2).bezc1y = -0.2*(tempsinpre)/thisratio1;
			(this.child2).bezc2x = 0.15*(tempcospre)/thisratio1;
			(this.child2).bezc2y = 0.15*(tempsinpre)/thisratio1;
			(this.child2).bezr = partl1;
			
			(this.child1).bezsx = -(0.3)*(tempcospre)/thisratio2;
			(this.child1).bezsy = -(0.3)*(tempsinpre)/thisratio2;
			(this.child1).bezex = tempcos3;
			(this.child1).bezey = tempsin3;
			(this.child1).bezc1x = 0.1*(tempcospre)/thisratio2;
			(this.child1).bezc1y = 0.1*(tempsinpre)/thisratio2;
			(this.child1).bezc2x = 0.9*tempcos3;
			(this.child1).bezc2y = 0.9*tempsin3;
			(this.child1).bezr = partl1;
			
			this.nextx2 = (1.3*Math.cos(angle))+(((this.bezr)-(partl1a*thisratio1))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty2 = (1.3*Math.sin(angle))+(((this.bezr)-(partl1a*thisratio1))/2.0)*tempsin90pre; // y reference point for both children
			this.nextx1 = (1.3*Math.cos(angle))-(((this.bezr)-(partl1b*thisratio2))/2.0)*tempcos90pre; // x refernece point for both children
			this.nexty1 = (1.3*Math.sin(angle))-(((this.bezr)-(partl1b*thisratio2))/2.0)*tempsin90pre; // y reference point for both children
		}
		
		this.arcx = this.bezex;
		this.arcy = this.bezey;
		this.arcr = (this.bezr)/2;
		
		if (this.child1)
		{
			if (child1right)
			{
				this.child1.precalc3 (x+((r)*(this.nextx1)),y+(r)*(this.nexty1),r*thisratio1,angle + Math.PI*thisangleright,!dir);
				this.child2.precalc3 (x+((r)*(this.nextx2)),y+(r)*(this.nexty2),r*thisratio2,angle - Math.PI*thisangleleft,!dir);
			}
			else
			{
				this.child2.precalc3 (x+((r)*(this.nextx2)),y+(r)*(this.nexty2),r*thisratio1,angle + Math.PI*thisangleright,!dir);
				this.child1.precalc3 (x+((r)*(this.nextx1)),y+(r)*(this.nexty1),r*thisratio2,angle - Math.PI*thisangleleft,!dir);
			}
		}
	}
	else
	{
		this.arcx = this.bezex+posmult*0.9*(tempcospre);
		this.arcy = this.bezey+posmult*0.9*(tempsinpre);
		this.arcr = leafmult*partc*0.9;
	}
}

function update_form()	
{
	// updates the view and all variables to match the current viewtype
	//fulltree.clearroute();
	fulltree.drawreg(xp,yp,220*ws);
	fulltree.move2();
	
	fulltree.bezsx = 0; // start x position
	fulltree.bezsy = 0; // start y position
	fulltree.bezex = 0; // end x position
	fulltree.bezey = -1; // end y position
	fulltree.bezc1x = 0; // control point 1 x position
	fulltree.bezc1y = -0.05; // control point 2 y position
	fulltree.bezc2x = 0; // control point 2 x position
	fulltree.bezc2y = -0.95; // control point 2 y position
	fulltree.bezr = partl1; // line width
	
	if (viewtype == 2)
	{
		fulltree.precalc2(xp,yp,220*ws,Math.PI*3/2);
	}
	else
	{
		if (viewtype == 3)
		{
			fulltree.bezsx = -Math.sin(Math.PI*0.05); // start x position
			fulltree.bezsy = 0; // start y position
			fulltree.bezex = -Math.sin(Math.PI*0.05); // end x position
			fulltree.bezey = -Math.cos(Math.PI*0.05); // end y position
			fulltree.bezc1x = -Math.sin(Math.PI*0.05); // control point 1 x position
			fulltree.bezc1y = -0.05; // control point 2 y position
			fulltree.bezc2x = -Math.sin(Math.PI*0.05); // control point 2 x position
			fulltree.bezc2y = -0.95; // control point 2 y position
			fulltree.bezr = partl1; // line width
			fulltree.precalc3(xp,yp,220*ws,Math.PI*(3/2-0.05),true,true);
		}
		else
		{
			fulltree.precalc(xp,yp,220*ws,Math.PI*3/2);
		}
	}
	fulltree.calchorizon();
	fulltree.graphref = true;
	fulltree.reref();
	//fulltree.clearsearch();
	Resize_only();
	fulltree.deanchor();
	fulltree.reref();
	fulltree.move3(40,widthres-40,40,heightres-40);		
	draw2();
}

// NODE OBJECT BASIC CALCULATIONS

midnode.prototype.richness_calc = function()
{
	if (this.child1)
	{
		this.richness_val =  (((this.child1).richness_calc())+((this.child2).richness_calc()));
	}
	else
	{
		if (this.richness_val <= 0)
		{
			this.richness_val = 1;
		}
	}
	return (this.richness_val);
}

midnode.prototype.concalc = function()
{
	this.num_EX = 0;
	this.num_EW = 0;
	this.num_CR = 0;
	this.num_EN = 0;
	this.num_VU = 0;
	this.num_NT = 0;
	this.num_LC = 0;
	this.num_DD = 0;
	this.num_NE = 0;
	
	this.num_I = 0;
	this.num_D = 0;
	this.num_S = 0;
	this.num_U = 0;
	
	if (this.child1)
	{
		(this.child1).concalc();
		(this.child2).concalc();
		
		
		this.num_EX = ((this.child1).num_EX) + ((this.child2).num_EX);
		this.num_EW = ((this.child1).num_EW) + ((this.child2).num_EW);
		this.num_CR = ((this.child1).num_CR) + ((this.child2).num_CR);
		this.num_EN = ((this.child1).num_EN) + ((this.child2).num_EN);
		this.num_VU = ((this.child1).num_VU) + ((this.child2).num_VU);
		this.num_NT = ((this.child1).num_NT) + ((this.child2).num_NT);
		this.num_LC = ((this.child1).num_LC) + ((this.child2).num_LC);
		this.num_DD = ((this.child1).num_DD) + ((this.child2).num_DD);
		this.num_NE = ((this.child1).num_NE) + ((this.child2).num_NE);
		
		this.num_I = ((this.child1).num_I) + ((this.child2).num_I);
		this.num_D = ((this.child1).num_D) + ((this.child2).num_D);
		this.num_S = ((this.child1).num_S) + ((this.child2).num_S);
		this.num_U = ((this.child1).num_U) + ((this.child2).num_U);
		
	}
	else
	{
		this.num_EX = 0;
		this.num_EW = 0;
		this.num_CR = 0;
		this.num_EN = 0;
		this.num_VU = 0;
		this.num_NT = 0;
		this.num_LC = 0;
		this.num_DD = 0;
		this.num_NE = 0;
	
		this.num_I = 0;
		this.num_D = 0;
		this.num_S = 0;
		this.num_U = 0;
		
		if (this.redlist)
		{
			switch(this.redlist)
			{
				case "EX":
				{
					this.num_EX = 1;
					break;
				}
				case "EW":
				{
					this.num_EW = 1;
					break;
				}
				case "CR":
				{
					this.num_CR = 1;
					break;
				}
				case "EN":
				{
					this.num_EN = 1;
					break;
				}
				case "VU":
				{
					this.num_VU = 1;
					break;
				}
				case "NT":
				{
					this.num_NT = 1;
					break;
				}
				case "LC":
				{
					this.num_LC = 1;
					break;
				}
				case "DD":
				{
					this.num_DD = 1;
					break;
				}
				case "NE":
				{
					this.num_NE = 1;
					break;
				}
				default:
				{
					this.num_NE = 1;	
					break;
				}
			}
		}
		else
		{
			this.num_NE = 1;
		}
		
		if (this.popstab)
		{
			switch(this.popstab)
			{
				case "I":
				{
					this.num_I = 1;
					break;
				}
				case "S":
				{
					this.num_S = 1;
					break;
				}
				case "D":
				{
					this.num_D = 1;
					break;
				}
				case "U":
				{
					this.num_U = 1;
					break;
				}
				default:
				{
					this.num_U = 1;	
					break;
				}
			}
		}
		else
		{
			this.num_U = 1;
		}
		
	}
}

midnode.prototype.name_calc = function()
{
	if (this.child1)
	{
		if (((this.child1).name_calc())==((this.child2).name_calc()))
		{
			this.name2 = ((this.child1).name2);
			this.hasname2 = true;
		}
	}
	return (this.name2);
}

midnode.prototype.phylogeneticdiv_calc = function()
{
	this.phylogenetic_diversity = 0;
	if (this.child1)
	{
		this.phylogenetic_diversity += (this.child2).phylogeneticdiv_calc();
		this.phylogenetic_diversity += (this.child1).phylogeneticdiv_calc();
	}
	return (this.phylogenetic_diversity + this.lengthbr);
}

midnode.prototype.age_calc = function()
{
	if ((this.lengthbr == 0)&&(this.child1))
	{
		this.npolyt = false;
	}
	else
	{
		this.npolyt = true;
	}
	var length_temp;
	length_temp = (this.lengthbr);
	if (this.child1)
	{
		(this.lengthbr) = (this.child2).age_calc();
		(this.lengthbr) = (this.child1).age_calc();
		return ((length_temp)+(this.lengthbr));
	}
	else
	{
		(this.lengthbr) = 0;
		return (length_temp);
	}	
}

midnode.prototype.inlabel_calc = function()
{
	if (this.child1)
	{
		if (!(this.name2))
		{
			if (this.child1.name2)
			{
				this.child1.inlabel = true;
			}
			else
			{
				this.child1.inlabel_calc();
			}
			if (this.child2.name2)
			{
				this.child2.inlabel = true;
			}
			else
			{
				this.child2.inlabel_calc();
			}
		}
		if (this.hasname1)
		{
			this.inlabel = true;
			this.name2 = this.name1;
			this.hasname2 = true;
		}
	}
	
}

midnode.prototype.insublabel_calc = function(num_since)
{
	if ((this.richness_val >= 10)&&(this.child1))
	{
		if (this.inlabel)
		{
			this.child1.insublabel_calc(0);
			this.child2.insublabel_calc(0);
		}
		else
		{
			if (num_since >=1)
			{
				this.insublabel = true;
				this.child1.insublabel_calc(0);
				this.child2.insublabel_calc(0);
			}
			else
			{
				this.child1.insublabel_calc(num_since+1);
				this.child2.insublabel_calc(num_since+1);
			}
		}
	}
	else
	{
		if (this.richness_val >= 1)
		{
			if (this.hasname2)
			{
				this.inlabel = true;
			}
			else
			{
				this.insublabel = true;
			}
		}
	}
}

// DEEP ZOOM REREFERENCING METHODS (COMPLEX)

// returns the product of all scaling factors so as to find out the total scaling difference
midnode.prototype.mult = function ()
{
	var multreturn;
	if (this.child1)
	{
		if (this.child1.graphref)
		{
			multreturn = (this.nextr1)*(this.child1.mult());
		}
		else
		{
			if (this.child2.graphref)
			{
				multreturn = (this.nextr2)*(this.child2.mult());
			}
			else
			{
				multreturn = 1;
			}
		}
	}
	else
	{
		multreturn = 1;
	}
	return multreturn;
}

midnode.prototype.reref = function()
{
	if (this.onroute)
	{
		this.graphref = true;
		if (this.child1)
		{
			if (this.child1.onroute)
			{
				this.child1.reref();
			}
			else
			{
				this.child1.graphref = false;
			}
			if (this.child2.onroute)
			{
				this.child2.reref();
			}
			else
			{
				this.child2.graphref = false;
			}	
		}
	}
}

midnode.prototype.calchorizon = function()
{
	// find the bounding box for the bezier curve
	this.hxmax = this.bezsx;
	this.hxmin = this.bezsx;
	this.hymax = this.bezsy;
	this.hymin = this.bezsy;
	if (this.hxmax < this.bezc1x) { this.hxmax = this.bezc1x; }
	if (this.hxmin > this.bezc1x) { this.hxmin = this.bezc1x; }
	if (this.hymax < this.bezc1y) { this.hymax = this.bezc1y; }
	if (this.hymin > this.bezc1y) { this.hymin = this.bezc1y; }
	if (this.hxmax < this.bezc2x) { this.hxmax = this.bezc2x; }
	if (this.hxmin > this.bezc2x) { this.hxmin = this.bezc2x; }
	if (this.hymax < this.bezc2y) { this.hymax = this.bezc2y; }
	if (this.hymin > this.bezc2y) { this.hymin = this.bezc2y; }
	if (this.hxmax < this.bezex) { this.hxmax = this.bezex; }
	if (this.hxmin > this.bezex) { this.hxmin = this.bezex; }
	if (this.hymax < this.bezey) { this.hymax = this.bezey; }
	if (this.hymin > this.bezey) { this.hymin = this.bezey; }
	this.hxmax += this.bezr/2;
	this.hxmin -= this.bezr/2;
	this.hymax += this.bezr/2;
	this.hymin -= this.bezr/2;
	
	//expand the bounding box to include the arc if necessary
	if (this.hxmax < (this.arcx+this.arcr)) { this.hxmax = (this.arcx+this.arcr); }
	if (this.hxmin > (this.arcx-this.arcr)) { this.hxmin = (this.arcx-this.arcr); }
	if (this.hymax < (this.arcy+this.arcr)) { this.hymax = (this.arcy+this.arcr); }
	if (this.hymin > (this.arcy-this.arcr)) { this.hymin = (this.arcy-this.arcr); }
	// set the graphics bounding box before the horizon is expanded for children
	this.gxmax = this.hxmax;
	this.gxmin = this.hxmin;
	this.gymax = this.hymax;
	this.gymin = this.hymin;
	
	// check for children
	if(this.child1)
	{
		// if children calculate their horizons
		this.child1.calchorizon ();
		this.child2.calchorizon ();
		// and expand the bounding box if necessary
		if (this.hxmax < (this.nextx1+this.nextr1*this.child1.hxmax)) { this.hxmax = (this.nextx1+this.nextr1*this.child1.hxmax); }
		if (this.hxmin > (this.nextx1+this.nextr1*this.child1.hxmin)) { this.hxmin = (this.nextx1+this.nextr1*this.child1.hxmin); }
		if (this.hymax < (this.nexty1+this.nextr1*this.child1.hymax)) { this.hymax = (this.nexty1+this.nextr1*this.child1.hymax); }
		if (this.hymin > (this.nexty1+this.nextr1*this.child1.hymin)) { this.hymin = (this.nexty1+this.nextr1*this.child1.hymin); }
		if (this.hxmax < (this.nextx2+this.nextr2*this.child2.hxmax)) { this.hxmax = (this.nextx2+this.nextr2*this.child2.hxmax); }
		if (this.hxmin > (this.nextx2+this.nextr2*this.child2.hxmin)) { this.hxmin = (this.nextx2+this.nextr2*this.child2.hxmin); }
		if (this.hymax < (this.nexty2+this.nextr2*this.child2.hymax)) { this.hymax = (this.nexty2+this.nextr2*this.child2.hymax); }
		if (this.hymin > (this.nexty2+this.nextr2*this.child2.hymin)) { this.hymin = (this.nexty2+this.nextr2*this.child2.hymin); }
	}
}
	
midnode.prototype.reanchor = function ()
{
	if (this.dvar)
	{
		this.graphref = true;
		if (((this.gvar)||(!(this.child1)))||((this.rvar/220>0.01)&&(this.rvar/220<100)))
		{
			// reanchor here
			xp = this.xvar;
			yp = this.yvar;
			ws = this.rvar/220;
			if (this.child1)
			{
				this.child2.deanchor();
				this.child1.deanchor();
			}
		}
		else
		{
			// reanchor somewhere down the line
			if (this.child1.dvar)
			{
				this.child1.reanchor();
				this.child2.deanchor();
				
			}
			else
			{
				this.child2.reanchor();
				this.child1.deanchor();
			}
		}
	}
	// else not possible to reanchor
}

midnode.prototype.deanchor = function ()
{
	if (this.graphref)
	{
		if (this.child1)
		{
			this.child1.deanchor();
			this.child2.deanchor();
		}
		this.graphref = false;
	}
}

midnode.prototype.drawreg = function(x,y,r)
{
	// we assume that only those for whom graphref is true will call this routine
	if (this.child1)
	{
		// we are not a leaf and we are referencing - check children
		if (this.child1.graphref)
		{
			// child 1 leads to (or is) the referencing node
			this.child1.drawreg(x,y,r);
			this.rvar = this.child1.rvar/this.nextr1;
			this.xvar = this.child1.xvar-this.rvar*this.nextx1;
			this.yvar = this.child1.yvar-this.rvar*this.nexty1;
			this.dvar = false;
			this.child2.gvar = false;
			this.child2.dvar = false; 
			
			if(((!((((this.xvar+(this.rvar*this.hxmax))<0)||((this.xvar+(this.rvar*this.hxmin))>widthres))||(((this.yvar+(this.rvar*this.hymax))<0)||((this.yvar+(this.rvar*this.hymin))>heightres))))))
			{
				if (this.rvar > threshold)
				{
					
					this.child2.drawreg2 (this.xvar+((this.rvar)*(this.nextx2)),this.yvar+(this.rvar)*(this.nexty2),this.rvar*this.nextr2);
				}
				
				if(((((this.xvar+(this.rvar*this.gxmax))<0)||((this.xvar+(this.rvar*this.gxmin))>widthres))||(((this.yvar+(this.rvar*this.gymax))<0)||((this.yvar+(this.rvar*this.gymin))>heightres))))
				{
					this.gvar = false;
				}
				else
				{
					this.gvar = true;
					this.dvar = true;
				}
				if (this.rvar <= threshold)
				{
					this.child1.gvar = false;
					this.child2.gvar = false;
					this.child1.dvar = false;
					this.child2.dvar = false;
				}
			}
			else
			{
				this.gvar = false;
			}
			
			if ((this.child1.dvar)||(this.child2.dvar))
			{
				this.dvar = true;
			}
			
		}
		else
		{
			if (this.child2.graphref)
			{
				// child 2 leads to (or is) the referencing node
				this.child2.drawreg(x,y,r);
				this.rvar = this.child2.rvar/this.nextr2;
				this.xvar = this.child2.xvar-this.rvar*this.nextx2;
				this.yvar = this.child2.yvar-this.rvar*this.nexty2;
				this.dvar = false;
				this.child1.gvar = false;
				this.child1.dvar = false; 
				
				if(((!((((this.xvar+(this.rvar*this.hxmax))<0)||((this.xvar+(this.rvar*this.hxmin))>widthres))||(((this.yvar+(this.rvar*this.hymax))<0)||((this.yvar+(this.rvar*this.hymin))>heightres))))))
				{
					if (this.rvar > threshold)
					{
						this.child1.drawreg2 (this.xvar+((this.rvar)*(this.nextx1)),this.yvar+(this.rvar)*(this.nexty1),this.rvar*this.nextr1);	
					}
					
					if(((((this.xvar+(this.rvar*this.gxmax))<0)||((this.xvar+(this.rvar*this.gxmin))>widthres))||(((this.yvar+(this.rvar*this.gymax))<0)||((this.yvar+(this.rvar*this.gymin))>heightres))))
					{
						this.gvar = false;
					}
					else
					{
						this.gvar = true;
						
						this.dvar = true;
					}
					
					if (this.rvar <= threshold)
					{
						this.child1.gvar = false;
						this.child2.gvar = false;
						this.child1.dvar = false;
						this.child2.dvar = false;
					}
				}
				else
				{
					this.gvar = false;
				}
				
				if ((this.child1.dvar)||(this.child2.dvar))
				{
					this.dvar = true;
				}
			}
			else
			{
				// we are the referencing node so call drawreg2
				this.drawreg2(x,y,r);
			}
		}
	}
	else
	{
		// we are a leaf and we are referencing - we are the referencing node so record x,y,r
		this.drawreg2(x,y,r); //does all we need and will automatically skip any child commands
	}
}

midnode.prototype.drawreg2 = function(x,y,r)
{
	this.xvar = x;
	this.yvar = y;
	this.rvar = r;
	this.dvar = false;	
	if(((!((((x+(r*this.hxmax))<0)||((x+(r*this.hxmin))>widthres))||(((y+(r*this.hymax))<0)||((y+(r*this.hymin))>heightres))))))
	{
		if (this.child1)
		{
			if (r > threshold)
			{
				this.child1.drawreg2 (x+((r)*(this.nextx1)),y+(r)*(this.nexty1),r*this.nextr1);
				this.child2.drawreg2 (x+((r)*(this.nextx2)),y+(r)*(this.nexty2),r*this.nextr2);
			}
			else
			{
				this.child1.gvar = false;
				this.child1.dvar = false; 
				this.child2.gavr = false;
				this.child2.dvar = false; 
			}
			
			if ((this.child1.dvar)||(this.child2.dvar))
			{
				this.dvar = true;
			}
		}
		if(((((x+(r*this.gxmax))<0)||((x+(r*this.gxmin))>widthres))||(((y+(r*this.gymax))<0)||((y+(r*this.gymin))>heightres))))
		{
			this.gvar = false;
		}
		else
		{
			this.gvar = true;
			this.dvar = true;

		}
	}
	else
	{
		this.gvar = false;
	}
}

// SEARCH UTILITIES

midnode.prototype.search = function()
{
	
	// initialize the search variables to the default (wipe previous searches)
	this.startscore = 0;
	this.targeted = false;
	this.searchinpast = 0; 
	this.flysofarA = false;
	this.flysofarB = false;
	var temphitsa = 0;

	var thishit = true;
	for (i = 0 ; i < searchinparts.length ; i ++)
	{
		if (!(this.searchone(searchinparts[i],false)))
		{
			thishit = false;
		}
	}
	if (thishit)
	{
		temphitsa += this.richness_val;
	}
	else
	{
		if (this.child1)
		{
			temphitsa += (this.child1).search();
			temphitsa += (this.child2).search();
		}
	}
	
	
	this.searchin = temphitsa;
	return temphitsa;
}


midnode.prototype.searchtarget = function()
{
	// go down richerside and then use density as decider
	// keep going until density reaches threshold
	var searchresult = -1;
	if ((this.searchin-this.searchinpast)>0)
	{
		if (((this.searchin-this.searchinpast) / (this.richness_val))>0.7)
		{
			this.targeted = true;
			if ((this.child1)&&(((this.child1).searchin > 0)||((this.child2).searchin > 0)))
			{
				if ((((this.child1).searchin)-((this.child1).searchinpast)) <= 0)
				{
					var returned = (this.child2).searchtarget();
					
					searchresult = returned;
				}
				else
				{
					if ((((this.child2).searchin)-((this.child2).searchinpast)) <= 0)
					{
						var returned = (this.child1).searchtarget();
						
						searchresult = returned;
					}
					else
					{
						searchresult = this.searchin;
					}
				}
			}
			else
			{
				searchresult = this.searchin;
			}
		}
		else
		{
			if (this.child1)
			{
				var searchresult1 = this.child1.searchtarget();
				var searchresult2 = this.child2.searchtarget();
			}
			if (searchresult1 > searchresult2)
			{
				this.child1.targeted = true;
				this.child2.targeted = false;
				searchresult = searchresult1;
			}
			else
			{
				this.child2.targeted = true;
				this.child1.targeted = false;
				searchresult = searchresult2;
			}
		}	
	}
	return (searchresult);
}

midnode.prototype.searchtargetmark = function()
{
	var searchresult = -1;
	if (this.targeted)
	{
		searchresult = this.searchin;
		if (this.child1)
		{
			if (this.child1.targeted)
			{
				searchresult = this.child1.searchtargetmark();
			}
			else
			{
				if (this.child2.targeted)
				{
					searchresult = this.child2.searchtargetmark();
				}
			}
		}
		this.searchinpast += searchresult;
	}
	return (searchresult);
}

midnode.prototype.clearsearch = function ()
{
	(this.searchin) = 0;
	this.targeted = false;
	this.searchinpast = 0;
	this.flysofarA = false;
	this.flysofarB = false;
	if (this.child1)
	{
		(this.child1).clearsearch();
		(this.child2).clearsearch();
	}		
}

midnode.prototype.clearroute = function ()
{
	this.onroute = false;
	if (this.child1)
	{
		(this.child1).clearroute();
		(this.child2).clearroute();
	}		
}

midnode.prototype.semiclearsearch = function ()
{
	this.targeted = false;
	this.flysofarA = false;
	this.flysofarB = false;
	if (this.child1)
	{
		(this.child1).semiclearsearch();
		(this.child2).semiclearsearch();
	}		
}

midnode.prototype.setxyr = function(x,y,r,xtargmin,xtargmax,ytargmin,ytargmax,movement,propmove)
{
	var vxmax;
	var vxmin;
	var vymax;
	var vymin;
	if (this.child1)
	{
		if (movement != 2)
		{
			vxmax = x+r*this.nextx1 + r*this.nextr1*this.child1.hxmax; 
			
			vxmin = x+r*this.nextx1 + r*this.nextr1*this.child1.hxmin; 
			
			vymax = y+r*this.nexty1 + r*this.nextr1*this.child1.hymax; 
			
			vymin = y+r*this.nexty1 + r*this.nextr1*this.child1.hymin; 
			if (movement != 1)
			{
				
				if (vxmax < (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmax)) 
				{ 
					vxmax = (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmax); 
				}
				if (vxmin > (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmin)) 
				{ 
					vxmin = (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmin); 
				}
				if (vymax < (y+r*this.nexty2 + r*this.nextr2*this.child2.hymax)) 
				{ 
					vymax = (y+r*this.nexty2 + r*this.nextr2*this.child2.hymax); 
				}
				if (vymin > (y+r*this.nexty2 + r*this.nextr2*this.child2.hymin)) 
				{ 
					vymin = (y+r*this.nexty2 + r*this.nextr2*this.child2.hymin); 
				}
			}
		}
		else
		{
			vxmax = x+r*this.nextx2 + r*this.nextr2*this.child2.hxmax; 
			vxmin = x+r*this.nextx2 + r*this.nextr2*this.child2.hxmin; 
			vymax = y+r*this.nexty2 + r*this.nextr2*this.child2.hymax; 
			vymin = y+r*this.nexty2 + r*this.nextr2*this.child2.hymin; 
		}
	}
	else
	{
		vxmax = (x+r*(this.arcx+this.arcr));
		vxmin = (x+r*(this.arcx-this.arcr));
		vymax = (y+r*(this.arcy+this.arcr));
		vymin = (y+r*(this.arcy-this.arcr));
	}
	
	if (vxmax < (x+r*(this.bezsx+this.bezex)/2)) { vxmax = (x+r*(this.bezsx+this.bezex)/2); }
	if (vxmin > (x+r*(this.bezsx+this.bezex)/2)) { vxmin = (x+r*(this.bezsx+this.bezex)/2); }
	if (vymax < (y+r*(this.bezsy+this.bezey)/2)) { vymax = (y+r*(this.bezsy+this.bezey)/2); }
	if (vymin > (y+r*(this.bezsy+this.bezey)/2)) { vymin = (y+r*(this.bezsy+this.bezey)/2); }
	
	var ywsmult = ((ytargmax-ytargmin)/(vymax-vymin));//propmove;
	// the number we need to multply ws by to get the right size for a vertical fit
	var xwsmult = ((xtargmax-xtargmin)/(vxmax-vxmin));//propmove;
	// the number we need to multply ws by to get the right size for a horizontal fit
	var wsmult;
	if (ywsmult > xwsmult)
	{
		// we use xwsmult - the smaller
		wsmult = xwsmult;
	}
	else
	{
		// we use ywsmult - the smaller
		wsmult = ywsmult;
	}
	xp += (((xtargmax+xtargmin)/2.0)-((vxmax+vxmin)/2.0));
	yp += (((ytargmax+ytargmin)/2.0)-((vymax+vymin)/2.0));
	ws = ws*wsmult;
	xp = widthres/2 + (xp-widthres/2)*wsmult;
	yp = heightres/2 + (yp-heightres/2)*wsmult;
}

midnode.prototype.setxyr3r = function(xtargmin,xtargmax,ytargmin,ytargmax)
{
	
	ws = 1; 
	xp = widthres/2; 
	yp = heightres; 
	var x = xp;
	var y = yp;
	var r = 220*ws;
	
	var vxmax;
	var vxmin;
	var vymax;
	var vymin;
	
	if (this.child1)
	{
		vxmax = x+r*this.nextx1 + r*this.nextr1*this.child1.hxmax; 
		vxmin = x+r*this.nextx1 + r*this.nextr1*this.child1.hxmin; 
		vymax = y+r*this.nexty1 + r*this.nextr1*this.child1.hymax; 
		vymin = y+r*this.nexty1 + r*this.nextr1*this.child1.hymin; 
		if (vxmax < (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmax)) 
		{ 
			vxmax = (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmax); 
		}
		if (vxmin > (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmin)) 
		{ 
			vxmin = (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmin); 
		}
		if (vymax < (y+r*this.nexty2 + r*this.nextr2*this.child2.hymax)) 
		{ 
			vymax = (y+r*this.nexty2 + r*this.nextr2*this.child2.hymax); 
		}
		if (vymin > (y+r*this.nexty2 + r*this.nextr2*this.child2.hymin)) 
		{ 
			vymin = (y+r*this.nexty2 + r*this.nextr2*this.child2.hymin); 
		}
	}
	else
	{
		vxmax = (x+r*(this.arcx+this.arcr));
		vxmin = (x+r*(this.arcx-this.arcr));
		vymax = (y+r*(this.arcy+this.arcr));
		vymin = (y+r*(this.arcy-this.arcr));
	}
	if (vxmax < (x+r*(this.bezsx+this.bezex)/2)) { vxmax = (x+r*(this.bezsx+this.bezex)/2); }
	if (vxmin > (x+r*(this.bezsx+this.bezex)/2)) { vxmin = (x+r*(this.bezsx+this.bezex)/2); }
	if (vymax < (y+r*(this.bezsy+this.bezey)/2)) { vymax = (y+r*(this.bezsy+this.bezey)/2); }
	if (vymin > (y+r*(this.bezsy+this.bezey)/2)) { vymin = (y+r*(this.bezsy+this.bezey)/2); }
	
	var ywsmult = ((ytargmax-ytargmin)/(vymax-vymin));//propmove;
	// the number we need to multply ws by to get the right size for a vertical fit
	var xwsmult = ((xtargmax-xtargmin)/(vxmax-vxmin));//propmove;
	// the number we need to multply ws by to get the right size for a horizontal fit
	var wsmult;
	if (ywsmult > xwsmult)
	{
		// we use xwsmult - the smaller
		wsmult = xwsmult;
	}
	else
	{
		// we use ywsmult - the smaller
		wsmult = ywsmult;
	}
	
	xp += (((xtargmax+xtargmin)/2.0)-((vxmax+vxmin)/2.0));//*((1-(1/wsmult))/(1-(Math.pow((1/wsmult),propmove))));
	yp += (((ytargmax+ytargmin)/2.0)-((vymax+vymin)/2.0));//*((1-(1/wsmult))/(1-(Math.pow((1/wsmult),propmove))));
	
	ws = ws*wsmult;
	xp = widthres/2 + (xp-widthres/2)*wsmult;
	yp = heightres/2 + (yp-heightres/2)*wsmult;
}

midnode.prototype.setxyr2 = function(x,y,r,xtargmin,xtargmax,ytargmin,ytargmax,movement,propmove,flynum)
{
	var vxmax;
	var vxmin;
	var vymax;
	var vymin;
	if (movement != 3)
	{
		vxmax = (x+r*(this.fxmax));//(x+r*(this.arcx+this.arcr));
		vxmin = (x+r*(this.fxmin));
		vymax = (y+r*(this.fymax));
		vymin = (y+r*(this.fymin));
	}
	else
	{
		if (this.child1)
		{
			vxmax = x+r*this.nextx1 + r*this.nextr1*this.child1.hxmax; 
			vxmin = x+r*this.nextx1 + r*this.nextr1*this.child1.hxmin; 
			vymax = y+r*this.nexty1 + r*this.nextr1*this.child1.hymax; 
			vymin = y+r*this.nexty1 + r*this.nextr1*this.child1.hymin; 
			if (vxmax < (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmax)) 
			{ 
				vxmax = (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmax); 
			}
			if (vxmin > (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmin)) 
			{ 
				vxmin = (x+r*this.nextx2 + r*this.nextr2*this.child2.hxmin); 
			}
			if (vymax < (y+r*this.nexty2 + r*this.nextr2*this.child2.hymax)) 
			{ 
				vymax = (y+r*this.nexty2 + r*this.nextr2*this.child2.hymax); 
			}
			if (vymin > (y+r*this.nexty2 + r*this.nextr2*this.child2.hymin)) 
			{ 
				vymin = (y+r*this.nexty2 + r*this.nextr2*this.child2.hymin); 
			}
		}
		else
		{
			vxmax = (x+r*(this.arcx+this.arcr));
			vxmin = (x+r*(this.arcx-this.arcr));
			vymax = (y+r*(this.arcy+this.arcr));
			vymin = (y+r*(this.arcy-this.arcr));
		}
		if (vxmax < (x+r*(this.bezsx+this.bezex)/2)) { vxmax = (x+r*(this.bezsx+this.bezex)/2); }
		if (vxmin > (x+r*(this.bezsx+this.bezex)/2)) { vxmin = (x+r*(this.bezsx+this.bezex)/2); }
		if (vymax < (y+r*(this.bezsy+this.bezey)/2)) { vymax = (y+r*(this.bezsy+this.bezey)/2); }
		if (vymin > (y+r*(this.bezsy+this.bezey)/2)) { vymin = (y+r*(this.bezsy+this.bezey)/2); }
	}
	
	var ywsmult = ((ytargmax-ytargmin)/(vymax-vymin));//propmove;
	// the number we need to multply ws by to get the right size for a vertical fit
	var xwsmult = ((xtargmax-xtargmin)/(vxmax-vxmin));//propmove;
	// the number we need to multply ws by to get the right size for a horizontal fit
	var wsmult;
	if (ywsmult > xwsmult)
	{
		// we use xwsmult - the smaller
		wsmult = xwsmult;
	}
	else
	{
		// we use ywsmult - the smaller
		wsmult = ywsmult;
	}
	
	wsmult =Math.pow(wsmult,(1.0/propmove));
	var xpadd;
	var ypadd;
	
	if (Math.abs(wsmult-1) < 0.000001)
	{
		xpadd = (((xtargmax+xtargmin)/2.0)-((vxmax+vxmin)/2.0));//*((1-(1/wsmult))/(1-(Math.pow((1/wsmult),propmove))));
		ypadd = (((ytargmax+ytargmin)/2.0)-((vymax+vymin)/2.0));//*((1-(1/wsmult))/(1-(Math.pow((1/wsmult),propmove))));
	}
	else
	{
		xpadd = (((xtargmax+xtargmin)/2.0)-((vxmax+vxmin)/2.0))*((1-(1/wsmult))/(1-(Math.pow((1/wsmult),propmove))));
		ypadd = (((ytargmax+ytargmin)/2.0)-((vymax+vymin)/2.0))*((1-(1/wsmult))/(1-(Math.pow((1/wsmult),propmove))));
	}
	xp+= xpadd;
	yp+= ypadd;
	ws = ws*wsmult;
	xp = widthres/2 + (xp-widthres/2)*wsmult;
	yp = heightres/2 + (yp-heightres/2)*wsmult;
}

midnode.prototype.move = function(xtargmin,xtargmax,ytargmin,ytargmax)
{
	if (this.targeted)
	{
		this.graphref = true;
		if (this.child1)
		{
			if (this.child1.targeted)
			{
				this.child1.move(xtargmin,xtargmax,ytargmin,ytargmax);
			}
			else
			{
				if (this.child2.targeted)
				{
					this.child2.move(xtargmin,xtargmax,ytargmin,ytargmax);
				}
				else
				{
					this.setxyr3r(40,widthres-40,40,heightres-40);
					this.setxyr3r(40,widthres-40,40,heightres-40);
				}
			}
		}
		else
		{
			this.setxyr3r(40,widthres-40,40,heightres-40);
			this.setxyr3r(40,widthres-40,40,heightres-40);
		}
	}
}	

midnode.prototype.move3 = function(xtargmin,xtargmax,ytargmin,ytargmax)
{
	if (this.onroute)
	{
		if (this.child1)
		{
			if (this.child1.onroute)
			{
				this.child1.move3(xtargmin,xtargmax,ytargmin,ytargmax);
			}
			else
			{
				if (this.child2.onroute)
				{
					this.child2.move3(xtargmin,xtargmax,ytargmin,ytargmax);
				}
				else
				{
					this.setxyr3r(40,widthres-40,40,heightres-40);
					this.setxyr3r(40,widthres-40,40,heightres-40);
				}
			}
		}
		else
		{
			this.setxyr3r(40,widthres-40,40,heightres-40);
			this.setxyr3r(40,widthres-40,40,heightres-40);
		}
	}
}	

midnode.prototype.move2 = function()
{
	if (this.dvar)
	{
		this.onroute = true;
		if ((!(this.gvar))&&(this.child1))
		{
			if (!((this.child1.dvar)&&(this.child2.dvar)))
			{
				if (this.child1.dvar)
				{
					this.child1.move2();
				}
				else
				{
					if (this.child2.dvar)
					{
						this.child2.move2();
					}
				}
			}
		}
	}
}

midnode.prototype.clearonroute = function()
{
	this.onroute = false;
	if (this.child1)
	{
		(this.child1).clearonroute();
		(this.child2).clearonroute();
	}
}

midnode.prototype.flyFB = function(xtargmin,xtargmax,ytargmin,ytargmax)
{
	var x = this.xvar;
	var y = this.yvar;
	var r = this.rvar;
	if (this.targeted)
	{	
		if (this.flysofarB)
		{
			if (this.child1)
			{
				if (this.child1.targeted)
				{
					this.child1.flyFB(xtargmin,xtargmax,ytargmin,ytargmax);
				}
				else
				{
					if (this.child2.targeted)
					{
						this.child2.flyFB(xtargmin,xtargmax,ytargmin,ytargmax);
					}
					else
					{
						if (this.flysofarB )
						{
							if (flying)
							{
								clearTimeout(t);
								fulltree.searchtargetmark();
								flying = false;
							}
						}
						else
						{
							this.setxyr2(x,y,r,xtargmin,xtargmax,ytargmin,ytargmax,3,countdownB,2);
							if (countdownB <= 1)
							{
								this.flysofarB = true;
								
								countdownB = 6;
								
							}
							else
							{
								countdownB --;
							}
						}
					}
				}
			}
			else
			{
				if (this.flysofarB )
				{
					if (flying)
					{
						clearTimeout(t);
						fulltree.searchtargetmark();
						flying = false;
					}
				}
				else
				{
					this.setxyr2(x,y,r,xtargmin,xtargmax,ytargmin,ytargmax,3,countdownB,2);
					if (countdownB <= 1)
					{
						this.flysofarB = true;
						
						countdownB = 6;
						
					}
					else
					{
						countdownB --;
					}
				}
			}
		}
		else
		{
			if (this.child1)
			{
				if (this.child1.targeted)
				{
					this.setxyr2(x,y,r,xtargmin,xtargmax,ytargmin,ytargmax,1,countdownB,2);
					if (countdownB <= 1)
					{
						this.flysofarB = true;
						countdownB = 6;
						
					}
					else
					{
						countdownB --;
					}
				}
				else
				{
					if (this.child2.targeted)
					{
						this.setxyr2(x,y,r,xtargmin,xtargmax,ytargmin,ytargmax,2,countdownB,2);
						if (countdownB <= 1)
						{
							this.flysofarB = true;
							
							countdownB = 6;
							
						}
						else
						{
							countdownB --;
						}
					}
					else
					{
					
						if (this.flysofarB )
						{
							if (flying)
							{
								clearTimeout(t);
								fulltree.searchtargetmark();
								flying = false;
							}
						}
						else
						{
							this.setxyr2(x,y,r,xtargmin,xtargmax,ytargmin,ytargmax,3,countdownB,2);
							if (countdownB <= 1)
							{
								this.flysofarB = true;
								
								countdownB = 6;
								
							}
							else
							{
								countdownB --;
							}
						}
					}
				}
			}
			else
			{
				if (this.flysofarB )
				{
					if (flying)
					{
						clearTimeout(t);
						fulltree.searchtargetmark();
						flying = false;
					}
				}
				else
				{
					this.setxyr2(x,y,r,xtargmin,xtargmax,ytargmin,ytargmax,3,countdownB,2);
					if (countdownB <= 1)
					{
						this.flysofarB = true;
						
						countdownB = 6;
						
					}
					else
					{
						countdownB --;
					}
				}
			}
		}
	}
}	

midnode.prototype.prepfly = function(x,y,r)
{
	if (this.targeted)
	{
		this.fxmax = this.gxmax;
		this.fxmin = this.gxmin;
		this.fymax = this.gymax;
		this.fymin = this.gymin;	
		
		// nothing to do otherwise
		if (this.child1)
		{
			if (this.child1.targeted)
			{
				this.child1.prepfly(x+r*this.nextx1,y+r*this.nexty1,r*this.nextr1);
				if (this.fxmax < (this.nextx1+this.nextr1*this.child1.fxmax)) { this.fxmax = (this.nextx1+this.nextr1*this.child1.fxmax) }
				if (this.fxmin > (this.nextx1+this.nextr1*this.child1.fxmin)) { this.fxmin = (this.nextx1+this.nextr1*this.child1.fxmin) }
				if (this.fymax < (this.nexty1+this.nextr1*this.child1.fymax)) { this.fymax = (this.nexty1+this.nextr1*this.child1.fymax) }
				if (this.fymin > (this.nexty1+this.nextr1*this.child1.fymin)) { this.fymin = (this.nexty1+this.nextr1*this.child1.fymin) }
				
			}
			else
			{
				if (this.child2.targeted)
				{
					this.child2.prepfly(x+r*this.nextx2,y+r*this.nexty2,r*this.nextr2);
					if (this.fxmax < (this.nextx2+this.nextr2*this.child2.fxmax)) { this.fxmax = (this.nextx2+this.nextr2*this.child2.fxmax) }
					if (this.fxmin > (this.nextx2+this.nextr2*this.child2.fxmin)) { this.fxmin = (this.nextx2+this.nextr2*this.child2.fxmin) }
					if (this.fymax < (this.nexty2+this.nextr2*this.child2.fymax)) { this.fymax = (this.nexty2+this.nextr2*this.child2.fymax) }
					if (this.fymin > (this.nexty2+this.nextr2*this.child2.fymin)) { this.fymin = (this.nexty2+this.nextr2*this.child2.fymin) }
					
				}
				else
				{
					this.fxmax = this.hxmax;
					this.fxmin = this.hxmin;
					this.fymax = this.hymax;
					this.fymin = this.hymin;	
				}
			}
		}
		else
		{
			this.fxmax = this.hxmax;
			this.fxmin = this.hxmin;
			this.fymax = this.hymax;
			this.fymin = this.hymin;	
		}
	}
}	

function marksearch()
{
	performsearch2(false);
	highlight_search = true;
	draw2();
}

function unmarksearch()
{
	highlight_search = false;
	draw2();
}

function performclear()
{
	highlight_search = false;
	searchinparts = [];
	context.clearRect(0,0, widthres,heightres);
	draw2();
}

function performfly()
{
	if (!flying)
	{
		fulltree.deanchor();
		fulltree.graphref = true;
		fulltree.setxyr(xp,yp,220*ws,20,widthres-2,20,heightres,0,1);
		fulltree.setxyr(xp,yp,220*ws,20,widthres-2,20,heightres,0,1);
		wsinit = ws;
		draw2();
		fulltree.semiclearsearch();
	
		flying = true;

		
		performsearch2(false);
		
		if (fulltree.searchtarget() == -1)
		{
			searchinparts = [];
			performsearch2(false);
			fulltree.searchtarget()
		}
		fulltree.targeted = true;
		//fulltree.searchtargetmark();
		countdownB = 12;
		fulltree.flysofarB = true;
		if (fulltree.child1)
		{
			if (fulltree.child1.targeted)
			{
				if (((fulltree.child1).child1)&&((fulltree.child1).child1.targeted||(fulltree.child1).child2.targeted))
				{
					fulltree.child1.flysofarB = true;
				}
			}
			if (fulltree.child2.targeted)
			{
				if (((fulltree.child2).child1)&&((fulltree.child2).child1.targeted||(fulltree.child2).child2.targeted))
				{
					fulltree.child2.flysofarB = true;
				}
			}
		}
		fulltree.prepfly(xp,yp,220*ws,5);
		performfly2();
	}
}

function performfly2()
{
	fulltree.drawreg(xp,yp,220*ws);
	fulltree.flyFB(40,widthres-40,40,heightres-40);
	draw2();
	if (flying)
	{
		t = setTimeout('performfly2()',100);
	}
}

function performleap()
{
	clearTimeout(t);
	flying = false;
	performsearch2(false);
	if (fulltree.searchtarget() == -1)
	{
		searchinparts = [];
		performsearch2(true);
		fulltree.searchtarget()
	}		
	fulltree.targeted = true;
	fulltree.searchtargetmark();
	fulltree.deanchor();		
	fulltree.move(40,widthres-40,40,heightres-40);
	draw2();
}

// GROW OPTIONS

midnode.prototype.oldest = function()
{
	var oldestreturn = 0.0;
	if(this.dvar)
	{
		if(this.gvar)
		{
			if (this.lengthbr)
			{
				if ( this.lengthbr > oldestreturn )
				{
					oldestreturn = this.lengthbr;
				}
			}
		}
		if (this.child1)
		{
			var oldestc1 = this.child1.oldest ();
			var oldestc2 = this.child2.oldest ();
			if (oldestc1 > oldestreturn)
			{
				oldestreturn = oldestc1;
			}
			if (oldestc2 > oldestreturn)
			{
				oldestreturn = oldestc2;
			}
		}
	}
	return oldestreturn;
}
	
function growstart()	
{
	timelim = fulltree.oldest();
	clearTimeout(t2);
	growingpause = true;
	growing = false;
	Resize();
}

function growrev()			
{
	if (timelim >= fulltree.oldest())
	{
		timelim = -0.001;
	}
	clearTimeout(t2);
	growingpause = false;
	growing = true;
	Resize();
	timeinc = fulltree.oldest()/(growthtimetot*10);
	grow3();
}

function growpause()
{
	clearTimeout(t2);
	growingpause = true;
	growing = false;
	Resize();
}

function growplay()
{
	if (timelim <= 0)
	{
		timelim = fulltree.oldest();
	}
	clearTimeout(t2);
	growingpause = false;
	growing = true;
	Resize();
	timeinc = fulltree.oldest()/(growthtimetot*10);
	grow2();
}

function growend()		
{
	clearTimeout(t2);
	timelim = -1;
	clearTimeout(t2);
	growingpause = false;
	growing = false;
	Resize();
}

function growfaster()
{
	
	growthtimetot = growthtimetot/1.25;
	timeinc = fulltree.oldest()/(growthtimetot*10);
}

function growslower()
{
	growthtimetot = growthtimetot*1.25;
	timeinc = fulltree.oldest()/(growthtimetot*10);
}

function grow2()
{
	if (timelim >= 0)
	{
		timelim -= timeinc;
		draw2();
		t2 = setTimeout('grow2()',100);
	}
	else
	{
		clearTimeout(t2);
		draw2();
		t2 = setTimeout('Resize()',500);
		growing = false;
		growingpause = false;
	}
}

function grow3()
{
	if (timelim <= fulltree.oldest())
	{
		timelim += timeinc;
		draw2();
		t2 = setTimeout('grow3()',100);
	}
	else
	{
		clearTimeout(t2);
		draw2();
		t2 = setTimeout('Resize()',500);
		growing = false;
		growingpause = true;
	}
}
