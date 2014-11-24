/*! DataTables Foundation integration
 * ©2011-2014 SpryMedia Ltd - datatables.net/license
 */
(function(c,a,d){var b=function(f,e){f.extend(e.ext.classes,{sWrapper:"dataTables_wrapper dt-foundation"});f.extend(true,e.defaults,{dom:"<'row'<'small-6 columns'l><'small-6 columns'f>r>t<'row'<'small-6 columns'i><'small-6 columns'p>>",renderer:"foundation"});e.ext.renderer.pageButton.foundation=function(k,r,q,p,o,j){var n=new e.Api(k);var l=k.oClasses;var i=k.oLanguage.oPaginate;var h,g;var m=function(t,x){var v,s,w,u;var y=function(z){z.preventDefault();if(z.data.action!=="ellipsis"){n.page(z.data.action).draw(false)}};for(v=0,s=x.length;v<s;v++){u=x[v];if(f.isArray(u)){m(t,u)}else{h="";g="";switch(u){case"ellipsis":h="&hellip;";g="unavailable";break;case"first":h=i.sFirst;g=u+(o>0?"":" unavailable");break;case"previous":h=i.sPrevious;g=u+(o>0?"":" unavailable");break;case"next":h=i.sNext;g=u+(o<j-1?"":" unavailable");break;case"last":h=i.sLast;g=u+(o<j-1?"":" unavailable");break;default:h=u+1;g=o===u?"current":"";break}if(h){w=f("<li>",{"class":l.sPageButton+" "+g,"aria-controls":k.sTableId,tabindex:k.iTabIndex,id:q===0&&typeof u==="string"?k.sTableId+"_"+u:null}).append(f("<a>",{href:"#"}).html(h)).appendTo(t);k.oApi._fnBindAction(w,{action:u},y)}}}};m(f(r).empty().html('<ul class="pagination"/>').children("ul"),p)};if(e.TableTools){f.extend(true,e.TableTools.classes,{container:"DTTT button-group",buttons:{normal:"button",disabled:"disabled"},collection:{container:"DTTT_dropdown dropdown-menu",buttons:{normal:"",disabled:"disabled"}},select:{row:"active"}});f.extend(true,e.TableTools.DEFAULTS.oTags,{collection:{container:"ul",button:"li",liner:"a"}})}};if(typeof define==="function"&&define.amd){define(["jquery","datatables"],b)}else{if(typeof exports==="object"){b(require("jquery"),require("datatables"))}else{if(jQuery){b(jQuery,jQuery.fn.dataTable)}}}})(window,document);

/*
 * File:        jquery.dataTables.grouping.js
 * Version:     1.2.9.
 * Author:      Jovan Popovic
 *
 * Copyright 2013 Jovan Popovic, all rights reserved.
 *
 * This source file is free software, under either the GPL v2 license or a
 * BSD style license, as supplied with this software.
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.
 * Parameters:
 * @iGroupingColumnIndex                                 Integer             Index of the column that will be used for grouping - default 0
 * @sGroupingColumnSortDirection                         Enumeration         Sort direction of the group
 * @iGroupingOrderByColumnIndex                          Integer             Index of the column that will be used for ordering groups
 * @sGroupingClass                                       String              Class that will be associated to the group row. Default - "group"
 * @sGroupItemClass                                      String              Class that will be associated to the group row of group items. Default - "group-item"
 * @bSetGroupingClassOnTR                                Boolean             If set class will be set to the TR instead of the TD withing the grouping TR
 * @bHideGroupingColumn                                  Boolean             Hide column used for grouping once results are grouped. Default - true
 * @bHideGroupingOrderByColumn                           Boolean             Hide column used for ordering groups once results are grouped. Default - true
 * @sGroupBy                                             Enumeration         Type of grouping that should be applied. Values "name"(default), "letter", "year"
 * @sGroupLabelPrefix                                    String              Prefix that will be added to each group cell
 * @bExpandableGrouping                                  Boolean             Attach expand/collapse handlers to the grouping rows
 * @bExpandSingleGroup                                   Boolean             Use accordon grouping
 * @iExpandGroupOffset                                   Integer             Number of pixels to set scroll position above the currently selected group. If -1 scroll will be alligned to the table
 * General settings
 * @sDateFormat: "dd/MM/yyyy"                            String              Date format used for grouping
 * @sEmptyGroupLabel                                     String              Lable that will be placed as group if grouping cells are empty. Default "-"

 * Parameters used in the second level grouping
 * @iGroupingColumnIndex2                                Integer             Index of the secondary column that will be used for grouping - default 0
 * @sGroupingColumnSortDirection2                        Enumeration         Sort direction of the secondary group
 * @iGroupingOrderByColumnIndex2                         Integer             Index of the column that will be used for ordering secondary groups
 * @sGroupingClass2                                      String              Class that will be associated to the secondary group row. Default "subgroup"
 * @sGroupItemClass2                                     String              Class that will be associated to the secondary group row of group items. Default "subgroup-item"
 * @bHideGroupingColumn2                                 Boolean             Hide column used for secondary grouping once results are grouped. Default - true,
 * @bHideGroupingOrderByColumn2                          Boolean             Hide column used for ordering secondary groups once results are grouped. Default - true,
 * @sGroupBy2                                            Enumeration         Type of grouping that should be applied to secondary column. Values "name"(default), "letter", "year",
 * @sGroupLabelPrefix2                                   String              Prefix that will be added to each secondary group cell
 * @fnOnGrouped                                          Function            Function that is called when grouping is finished. Function has no parameters.
 */
(function(a){a.fn.rowGrouping=function(e){function b(){}function c(j,h,i){}function d(j,h,i){}function g(i){var h=["January","February","March","April","May","June","July","August","September","October","November","December"];return h[i-1]}var f={iGroupingColumnIndex:0,sGroupingColumnSortDirection:"",iGroupingOrderByColumnIndex:-1,sGroupingClass:"group",sGroupItemClass:"group-item",bHideGroupingColumn:true,bHideGroupingOrderByColumn:true,sGroupBy:"name",sGroupLabelPrefix:"",fnGroupLabelFormat:function(h){return h},bExpandableGrouping:false,bExpandSingleGroup:false,iExpandGroupOffset:100,asExpandedGroups:null,sDateFormat:"dd/MM/yyyy",sEmptyGroupLabel:"-",bSetGroupingClassOnTR:false,iGroupingColumnIndex2:-1,sGroupingColumnSortDirection2:"",iGroupingOrderByColumnIndex2:-1,sGroupingClass2:"subgroup",sGroupItemClass2:"subgroup-item",bHideGroupingColumn2:true,bHideGroupingOrderByColumn2:true,sGroupBy2:"name",sGroupLabelPrefix2:"",fnGroupLabelFormat2:function(h){return h},bExpandableGrouping2:false,fnOnGrouped:b,fnOnGroupCreated:c,fnOnGroupCompleted:d,oHideEffect:null,oShowEffect:null,bUseFilteringForGrouping:false};return this.each(function(s,J){var E=a(J).dataTable();var B=new Array();a(this).dataTableExt.aoGroups=B;function q(T,i,P){var R=document.createElement("tr");var S=document.createElement("td");R.id="group-id-"+E.attr("id")+"_"+T;var Q={id:R.id,key:T,text:i,level:0,groupItemClass:".group-item-"+T,dataGroup:T,aoSubgroups:new Array()};if(t.bSetGroupingClassOnTR){R.className=t.sGroupingClass+" "+T}else{S.className=t.sGroupingClass+" "+T}S.colSpan=P;S.innerHTML=t.sGroupLabelPrefix+t.fnGroupLabelFormat(i==""?t.sEmptyGroupLabel:i,Q);if(t.bExpandableGrouping){if(!I(T)){S.className+=" expanded-group";Q.state="expanded"}else{S.className+=" collapsed-group";Q.state="collapsed"}S.className+=" group-item-expander";a(S).attr("data-group",Q.dataGroup);a(S).attr("data-group-level",Q.level);a(S).click(h)}R.appendChild(S);B[T]=Q;Q.nGroup=R;t.fnOnGroupCreated(Q,T,1);return Q}function w(R,Q,P,T){var i=document.createElement("tr");i.id=T.id+"_"+R;var V=document.createElement("td");var U=T.dataGroup+"_"+R;var S={id:i.id,key:R,text:Q,level:T.level+1,groupItemClass:".group-item-"+U,dataGroup:U,aoSubgroups:new Array()};if(t.bSetGroupingClassOnTR){i.className=t.sGroupingClass2+" "+R}else{V.className=t.sGroupingClass2+" "+R}V.colSpan=P;V.innerHTML=t.sGroupLabelPrefix2+t.fnGroupLabelFormat2(Q==""?t.sEmptyGroupLabel:Q,S);if(t.bExpandableGrouping){i.className+=" group-item-"+T.dataGroup}if(t.bExpandableGrouping&&t.bExpandableGrouping2){if(!I(S.dataGroup)){V.className+=" expanded-group";S.state="expanded"}else{V.className+=" collapsed-group";S.state="collapsed"}V.className+=" group-item-expander";a(V).attr("data-group",S.dataGroup);a(V).attr("data-group-level",S.level);a(V).click(h)}i.appendChild(V);T.aoSubgroups[S.dataGroup]=S;B[S.dataGroup]=S;S.nGroup=i;t.fnOnGroupCreated(S,R,2);return S}function I(i){if(B[i]!=null){return(B[i].state=="collapsed")}else{if(i.indexOf("_")>-1){true}else{if(l&&(j==null||j.length==0)){return false}else{return(a.inArray(i,j)==-1)}}}}function L(i){if(i.length<(x+K)){return i}else{return i.substr(x,K)}}function y(i){return i}function M(i){return i.substr(0,1)}function O(i){return L(i)}function C(i){return i.substr(x,K)+" "+g(i.substr(r,H))}function u(i){if(i===""){return"-"}return i.toLowerCase().replace(/[^a-zA-Z0-9\u0080-\uFFFF]+/g,"-")}function D(R,P,i){if(R.nTable.id!==E[0].id){return true}var Q=P[t.iGroupingColumnIndex];if(typeof Q==="undefined"){Q=P[R.aoColumns[t.iGroupingColumnIndex].mDataProp]}if(I(u(Q))){if(E.fnIsOpen(E.fnGetNodes(i))){if(t.fnOnRowClosed!=null){t.fnOnRowClosed(this)}E.fnClose(E.fnGetNodes(i))}return false}return true}function p(i){B[i].state="expanded";a("td[data-group^='"+i+"']").removeClass("collapsed-group");a("td[data-group^='"+i+"']").addClass("expanded-group");if(t.bUseFilteringForGrouping){E.fnDraw();return}if(jQuery.inArray(i,j)==-1){j.push(i)}if(t.oHideEffect!=null){a(".group-item-"+i,E)[t.oShowEffect.method](t.oShowEffect.duration,t.oShowEffect.easing,function(){})}else{a(".group-item-"+i,E).show()}}function m(i){B[i].state="collapsed";a("td[data-group^='"+i+"']").removeClass("expanded-group");a("td[data-group^='"+i+"']").addClass("collapsed-group");if(t.bUseFilteringForGrouping){E.fnDraw();return}a(".group-item-"+i).each(function(){if(E.fnIsOpen(this)){if(t.fnOnRowClosed!=null){t.fnOnRowClosed(this)}E.fnClose(this)}});if(t.oHideEffect!=null){a(".group-item-"+i,E)[t.oHideEffect.method](t.oHideEffect.duration,t.oHideEffect.easing,function(){})}else{a(".group-item-"+i,E).hide()}}function h(T){var Q=a(this).attr("data-group");var S=a(this).attr("data-group-level");var R=!I(Q);if(t.bExpandSingleGroup){if(!R){var P=a("td.expanded-group").attr("data-group");m(P);p(Q);if(t.iExpandGroupOffset!=-1){var i=a("#group-id-"+E.attr("id")+"_"+Q).offset().top-t.iExpandGroupOffset;window.scroll(0,i)}else{var i=E.offset().top;window.scroll(0,i)}}}else{if(R){m(Q)}else{p(Q)}}T.preventDefault()}function A(V){if(E.fnSettings().oFeatures.bServerSide){l=true}var Z=false;if(t.iGroupingColumnIndex2!=-1){Z=true}if(V.aiDisplayMaster.length==0){return}var T=a("tbody tr",E);var Q=0;for(var ae=0;ae<V.aoColumns.length;ae++){if(V.aoColumns[ae].bVisible){Q+=1}}var ah=null;var aa=null;if(V.aiDisplay.length>0){for(var ag=0;ag<T.length;ag++){var U=V._iDisplayStart+ag;if(E.fnSettings().oFeatures.bServerSide){U=ag}var S="";var af=null;var P="";var Y=null;S=this.fnGetData(T[ag],t.iGroupingColumnIndex);var af=S;if(t.sGroupBy!="year"){af=N(S)}if(Z){P=V.aoData[V.aiDisplay[U]]._aData[t.iGroupingColumnIndex2];if(P==undefined){P=V.aoData[V.aiDisplay[U]]._aData[V.aoColumns[t.iGroupingColumnIndex2].mDataProp]}if(t.sGroupBy2!="year"){Y=N(P)}}if(ah==null||u(af)!=u(ah)){var ab=u(af);if(ah!=null){t.fnOnGroupCompleted(B[u(ah)])}if(t.bAddAllGroupsAsExpanded&&jQuery.inArray(ab,j)==-1){j.push(ab)}var W=q(ab,af,Q);var R=W.nGroup;if(T[ag].parentNode!=null){T[ag].parentNode.insertBefore(R,T[ag])}else{a(T[ag]).before(R)}ah=af;aa=null}a(T[ag]).attr("data-group",B[ab].dataGroup);a(T[ag]).addClass(t.sGroupItemClass);a(T[ag]).addClass("group-item-"+ab);if(t.bExpandableGrouping){if(I(ab)&&!t.bUseFilteringForGrouping){a(T[ag]).hide()}}if(Z){if(aa==null||u(Y)!=u(aa)){var X=u(af)+"-"+u(Y);var ac=w(X,Y,Q,B[ab]);var ad=ac.nGroup;T[ag].parentNode.insertBefore(ad,T[ag]);aa=Y}a(T[ag]).attr("data-group",ac.dataGroup).addClass(t.sGroupItemClass2).addClass("group-item-"+ac.dataGroup)}}}if(ah!=null){t.fnOnGroupCompleted(B[u(ah)])}t.fnOnGrouped(B);l=false}var x=6;var K=4;var j=new Array();var l=true;var t=a.extend(f,e);if(t.iGroupingOrderByColumnIndex==-1){t.bCustomColumnOrdering=false;t.iGroupingOrderByColumnIndex=t.iGroupingColumnIndex}else{t.bCustomColumnOrdering=true}if(t.sGroupingColumnSortDirection==""){if(t.sGroupBy=="year"){t.sGroupingColumnSortDirection="desc"}else{t.sGroupingColumnSortDirection="asc"}}if(t.iGroupingOrderByColumnIndex2==-1){t.bCustomColumnOrdering2=false;t.iGroupingOrderByColumnIndex2=t.iGroupingColumnIndex2}else{t.bCustomColumnOrdering2=true}if(t.sGroupingColumnSortDirection2==""){if(t.sGroupBy2=="year"){t.sGroupingColumnSortDirection2="desc"}else{t.sGroupingColumnSortDirection2="asc"}}x=t.sDateFormat.toLowerCase().indexOf("yy");K=t.sDateFormat.toLowerCase().lastIndexOf("y")-t.sDateFormat.toLowerCase().indexOf("y")+1;var r=t.sDateFormat.toLowerCase().indexOf("mm");var H=t.sDateFormat.toLowerCase().lastIndexOf("m")-t.sDateFormat.toLowerCase().indexOf("m")+1;var N=y;switch(t.sGroupBy){case"letter":N=M;break;case"year":N=O;break;case"month":N=C;break;default:N=y;break}if(t.asExpandedGroups!=null){if(t.asExpandedGroups=="NONE"){t.asExpandedGroups=[];j=t.asExpandedGroups;l=false}else{if(t.asExpandedGroups=="ALL"){t.bAddAllGroupsAsExpanded=true}else{if(t.asExpandedGroups.constructor==String){var k=t.asExpandedGroups;t.asExpandedGroups=new Array();t.asExpandedGroups.push(u(k));j=t.asExpandedGroups;l=false}else{if(t.asExpandedGroups.constructor==Array){for(var G=0;G<t.asExpandedGroups.length;G++){j.push(u(t.asExpandedGroups[G]));if(t.bExpandSingleGroup){break}}l=false}}}}}else{t.asExpandedGroups=new Array();t.bAddAllGroupsAsExpanded=true}if(t.bExpandSingleGroup){var o=a("tbody tr",E);var n=E.fnGetData(o[0],t.iGroupingColumnIndex);var F=n;if(t.sGroupBy!="year"){F=N(n)}var z=u(F);t.asExpandedGroups=new Array();t.asExpandedGroups.push(z)}E.fnSetColumnVis(t.iGroupingColumnIndex,!t.bHideGroupingColumn);if(t.bCustomColumnOrdering){E.fnSetColumnVis(t.iGroupingOrderByColumnIndex,!t.bHideGroupingOrderByColumn)}if(t.iGroupingColumnIndex2!=-1){E.fnSetColumnVis(t.iGroupingColumnIndex2,!t.bHideGroupingColumn2)}if(t.bCustomColumnOrdering2){E.fnSetColumnVis(t.iGroupingOrderByColumnIndex2,!t.bHideGroupingOrderByColumn2)}E.fnSettings().aoDrawCallback.push({fn:A,sName:"fnRowGrouping"});var v=new Array();v.push([t.iGroupingOrderByColumnIndex,t.sGroupingColumnSortDirection]);if(t.iGroupingColumnIndex2!=-1){v.push([t.iGroupingOrderByColumnIndex2,t.sGroupingColumnSortDirection2])}E.fnSettings().aaSortingFixed=v;switch(t.sGroupBy){case"name":break;case"letter":E.fnSettings().aoColumns[t.iGroupingOrderByColumnIndex].sSortDataType="rg-letter";a.fn.dataTableExt.afnSortData["rg-letter"]=function(Q,P){var i=[];a("td:eq("+P+")",Q.oApi._fnGetTrNodes(Q)).each(function(){i.push(M(this.innerHTML))});return i};break;case"year":E.fnSettings().aoColumns[t.iGroupingOrderByColumnIndex].sSortDataType="rg-date";a.fn.dataTableExt.afnSortData["rg-date"]=function(R,P){var i=[];var Q=R.oApi._fnGetTrNodes(R);for(G=0;G<Q.length;G++){i.push(L(E.fnGetData(Q[G],P)))}return i};break;default:break}if(t.bUseFilteringForGrouping){a.fn.dataTableExt.afnFiltering.push(D)}E.fnDraw()})}})(jQuery);

/*!
 Scroller 1.2.2
 Â©2011-2014 SpryMedia Ltd - datatables.net/license
 */
(function(m,n,k){var l=function(e){var g=function(a,b){!this instanceof g?alert("Scroller warning: Scroller must be initialised with the 'new' keyword."):("undefined"==typeof b&&(b={}),this.s={dt:a,tableTop:0,tableBottom:0,redrawTop:0,redrawBottom:0,autoHeight:!0,viewportRows:0,stateTO:null,drawTO:null,heights:{jump:null,page:null,virtual:null,scroll:null,row:null,viewport:null},topRowFloat:0,scrollDrawDiff:null,loaderVisible:!1},this.s=e.extend(this.s,g.oDefaults,b),this.s.heights.row=this.s.rowHeight,
    this.dom={force:n.createElement("div"),scroller:null,table:null,loader:null},this.s.dt.oScroller=this,this._fnConstruct())};g.prototype={fnRowToPixels:function(a,b,c){a=c?this._domain("virtualToPhysical",a*this.s.heights.row):this.s.baseScrollTop+(a-this.s.baseRowTop)*this.s.heights.row;return b||b===k?parseInt(a,10):a},fnPixelsToRow:function(a,b,c){var d=a-this.s.baseScrollTop,a=c?this._domain("physicalToVirtual",a)/this.s.heights.row:d/this.s.heights.row+this.s.baseRowTop;return b||b===k?parseInt(a,
    10):a},fnScrollToRow:function(a,b){var c=this,d=!1,f=this.fnRowToPixels(a),h=a-(this.s.displayBuffer-1)/2*this.s.viewportRows;0>h&&(h=0);if((f>this.s.redrawBottom||f<this.s.redrawTop)&&this.s.dt._iDisplayStart!==h)d=!0,f=this.fnRowToPixels(a,!1,!0);"undefined"==typeof b||b?(this.s.ani=d,e(this.dom.scroller).animate({scrollTop:f},function(){setTimeout(function(){c.s.ani=!1},25)})):e(this.dom.scroller).scrollTop(f)},fnMeasure:function(a){this.s.autoHeight&&this._fnCalcRowHeight();var b=this.s.heights;
    b.viewport=e(this.dom.scroller).height();this.s.viewportRows=parseInt(b.viewport/b.row,10)+1;this.s.dt._iDisplayLength=this.s.viewportRows*this.s.displayBuffer;(a===k||a)&&this.s.dt.oInstance.fnDraw()},_fnConstruct:function(){var a=this;if(this.s.dt.oFeatures.bPaginate){this.dom.force.style.position="absolute";this.dom.force.style.top="0px";this.dom.force.style.left="0px";this.dom.force.style.width="1px";this.dom.scroller=e("div."+this.s.dt.oClasses.sScrollBody,this.s.dt.nTableWrapper)[0];this.dom.scroller.appendChild(this.dom.force);
    this.dom.scroller.style.position="relative";this.dom.table=e(">table",this.dom.scroller)[0];this.dom.table.style.position="absolute";this.dom.table.style.top="0px";this.dom.table.style.left="0px";e(this.s.dt.nTableWrapper).addClass("DTS");this.s.loadingIndicator&&(this.dom.loader=e('<div class="DTS_Loading">'+this.s.dt.oLanguage.sLoadingRecords+"</div>").css("display","none"),e(this.dom.scroller.parentNode).css("position","relative").append(this.dom.loader));this.s.heights.row&&"auto"!=this.s.heights.row&&
    (this.s.autoHeight=!1);this.fnMeasure(!1);this.s.ingnoreScroll=!0;this.s.stateSaveThrottle=this.s.dt.oApi._fnThrottle(function(){a.s.dt.oApi._fnSaveState(a.s.dt)},500);e(this.dom.scroller).on("scroll.DTS",function(){a._fnScroll.call(a)});e(this.dom.scroller).on("touchstart.DTS",function(){a._fnScroll.call(a)});this.s.dt.aoDrawCallback.push({fn:function(){a.s.dt.bInitialised&&a._fnDrawCallback.call(a)},sName:"Scroller"});e(m).on("resize.DTS",function(){a.fnMeasure(false);a._fnInfo()});var b=!0;this.s.dt.oApi._fnCallbackReg(this.s.dt,
        "aoStateSaveParams",function(c,d){if(b&&a.s.dt.oLoadedState){d.iScroller=a.s.dt.oLoadedState.iScroller;d.iScrollerTopRow=a.s.dt.oLoadedState.iScrollerTopRow;b=false}else{d.iScroller=a.dom.scroller.scrollTop;d.iScrollerTopRow=a.s.topRowFloat}},"Scroller_State");this.s.dt.oLoadedState&&(this.s.topRowFloat=this.s.dt.oLoadedState.iScrollerTopRow||0);this.s.dt.aoDestroyCallback.push({sName:"Scroller",fn:function(){e(m).off("resize.DTS");e(a.dom.scroller).off("touchstart.DTS scroll.DTS");e(a.s.dt.nTableWrapper).removeClass("DTS");
        e("div.DTS_Loading",a.dom.scroller.parentNode).remove();a.dom.table.style.position="";a.dom.table.style.top="";a.dom.table.style.left=""}})}else this.s.dt.oApi._fnLog(this.s.dt,0,"Pagination must be enabled for Scroller")},_fnScroll:function(){var a=this,b=this.s.heights,c=this.dom.scroller.scrollTop,d;if(!this.s.skip&&!this.s.ingnoreScroll)if(this.s.dt.bFiltered||this.s.dt.bSorted)this.s.lastScrollTop=0;else{this._fnInfo();clearTimeout(this.s.stateTO);this.s.stateTO=setTimeout(function(){a.s.dt.oApi._fnSaveState(a.s.dt)},
    250);if(c<this.s.redrawTop||c>this.s.redrawBottom){var f=Math.ceil((this.s.displayBuffer-1)/2*this.s.viewportRows);Math.abs(c-this.s.lastScrollTop)>b.viewport||this.s.ani?(d=parseInt(this._domain("physicalToVirtual",c)/b.row,10)-f,this.s.topRowFloat=this._domain("physicalToVirtual",c)/b.row):(d=this.fnPixelsToRow(c)-f,this.s.topRowFloat=this.fnPixelsToRow(c,!1));0>=d?d=0:d+this.s.dt._iDisplayLength>this.s.dt.fnRecordsDisplay()?(d=this.s.dt.fnRecordsDisplay()-this.s.dt._iDisplayLength,0>d&&(d=0)):
    0!==d%2&&d++;if(d!=this.s.dt._iDisplayStart&&(this.s.tableTop=e(this.s.dt.nTable).offset().top,this.s.tableBottom=e(this.s.dt.nTable).height()+this.s.tableTop,b=function(){if(a.s.scrollDrawReq===null)a.s.scrollDrawReq=c;a.s.dt._iDisplayStart=d;a.s.dt.oApi._fnCalculateEnd&&a.s.dt.oApi._fnCalculateEnd(a.s.dt);a.s.dt.oApi._fnDraw(a.s.dt)},this.s.dt.oFeatures.bServerSide?(clearTimeout(this.s.drawTO),this.s.drawTO=setTimeout(b,this.s.serverWait)):b(),this.dom.loader&&!this.s.loaderVisible))this.dom.loader.css("display",
    "block"),this.s.loaderVisible=!0}this.s.lastScrollTop=c;this.s.stateSaveThrottle()}},_domain:function(a,b){var c=this.s.heights,d;if(c.virtual===c.scroll){d=(c.virtual-c.viewport)/(c.scroll-c.viewport);if("virtualToPhysical"===a)return b/d;if("physicalToVirtual"===a)return b*d}var e=(c.scroll-c.viewport)/2,h=(c.virtual-c.viewport)/2;d=h/(e*e);if("virtualToPhysical"===a){if(b<h)return Math.pow(b/d,0.5);b=2*h-b;return 0>b?c.scroll:2*e-Math.pow(b/d,0.5)}if("physicalToVirtual"===a){if(b<e)return b*b*
    d;b=2*e-b;return 0>b?c.virtual:2*h-b*b*d}},_fnDrawCallback:function(){var a=this,b=this.s.heights,c=this.dom.scroller.scrollTop,d=e(this.s.dt.nTable).height(),f=this.s.dt._iDisplayStart,h=this.s.dt._iDisplayLength,g=this.s.dt.fnRecordsDisplay();this.s.skip=!0;this._fnScrollForce();c=0===f?this.s.topRowFloat*b.row:f+h>=g?b.scroll-(g-this.s.topRowFloat)*b.row:this._domain("virtualToPhysical",this.s.topRowFloat*b.row);this.dom.scroller.scrollTop=c;this.s.baseScrollTop=c;this.s.baseRowTop=this.s.topRowFloat;
    var j=c-(this.s.topRowFloat-f)*b.row;0===f?j=0:f+h>=g&&(j=b.scroll-d);this.dom.table.style.top=j+"px";this.s.tableTop=j;this.s.tableBottom=d+this.s.tableTop;d=(c-this.s.tableTop)*this.s.boundaryScale;this.s.redrawTop=c-d;this.s.redrawBottom=c+d;this.s.skip=!1;this.s.dt.oFeatures.bStateSave&&null!==this.s.dt.oLoadedState&&"undefined"!=typeof this.s.dt.oLoadedState.iScroller?((c=(this.s.dt.sAjaxSource||a.s.dt.ajax)&&!this.s.dt.oFeatures.bServerSide?!0:!1)&&2==this.s.dt.iDraw||!c&&1==this.s.dt.iDraw)&&
        setTimeout(function(){e(a.dom.scroller).scrollTop(a.s.dt.oLoadedState.iScroller);a.s.redrawTop=a.s.dt.oLoadedState.iScroller-b.viewport/2;setTimeout(function(){a.s.ingnoreScroll=!1},0)},0):a.s.ingnoreScroll=!1;setTimeout(function(){a._fnInfo.call(a)},0);this.dom.loader&&this.s.loaderVisible&&(this.dom.loader.css("display","none"),this.s.loaderVisible=!1)},_fnScrollForce:function(){var a=this.s.heights;a.virtual=a.row*this.s.dt.fnRecordsDisplay();a.scroll=a.virtual;1E6<a.scroll&&(a.scroll=1E6);this.dom.force.style.height=
    a.scroll+"px"},_fnCalcRowHeight:function(){var a=this.s.dt,b=a.nTable,c=b.cloneNode(!1),d=e("<tbody/>").appendTo(c),f=e('<div class="'+a.oClasses.sWrapper+' DTS"><div class="'+a.oClasses.sScrollWrapper+'"><div class="'+a.oClasses.sScrollBody+'"></div></div></div>');for(e("tbody tr:lt(4)",b).clone().appendTo(d);3>e("tr",d).length;)d.append("<tr><td>&nbsp;</td></tr>");e("div."+a.oClasses.sScrollBody,f).append(c);a._bInitComplete?a=b.parentNode:(this.s.dt.nHolding||(this.s.dt.nHolding=e("<div></div>").insertBefore(this.s.dt.nTable)),
    a=this.s.dt.nHolding);f.appendTo(a);this.s.heights.row=e("tr",d).eq(1).outerHeight();f.remove()},_fnInfo:function(){if(this.s.dt.oFeatures.bInfo){var a=this.s.dt,b=a.oLanguage,c=this.dom.scroller.scrollTop,d=Math.floor(this.fnPixelsToRow(c,!1,this.s.ani)+1),f=a.fnRecordsTotal(),h=a.fnRecordsDisplay(),c=Math.ceil(this.fnPixelsToRow(c+this.s.heights.viewport,!1,this.s.ani)),c=h<c?h:c,g=a.fnFormatNumber(d),j=a.fnFormatNumber(c),i=a.fnFormatNumber(f),k=a.fnFormatNumber(h),g=0===a.fnRecordsDisplay()&&
    a.fnRecordsDisplay()==a.fnRecordsTotal()?b.sInfoEmpty+b.sInfoPostFix:0===a.fnRecordsDisplay()?b.sInfoEmpty+" "+b.sInfoFiltered.replace("_MAX_",i)+b.sInfoPostFix:a.fnRecordsDisplay()==a.fnRecordsTotal()?b.sInfo.replace("_START_",g).replace("_END_",j).replace("_MAX_",i).replace("_TOTAL_",k)+b.sInfoPostFix:b.sInfo.replace("_START_",g).replace("_END_",j).replace("_MAX_",i).replace("_TOTAL_",k)+" "+b.sInfoFiltered.replace("_MAX_",a.fnFormatNumber(a.fnRecordsTotal()))+b.sInfoPostFix;(b=b.fnInfoCallback)&&
(g=b.call(a.oInstance,a,d,c,f,h,g));a=a.aanFeatures.i;if("undefined"!=typeof a){d=0;for(f=a.length;d<f;d++)e(a[d]).html(g)}}}};g.defaults={trace:!1,rowHeight:"auto",serverWait:200,displayBuffer:9,boundaryScale:0.5,loadingIndicator:!1};g.oDefaults=g.defaults;g.version="1.2.2";"function"==typeof e.fn.dataTable&&"function"==typeof e.fn.dataTableExt.fnVersionCheck&&e.fn.dataTableExt.fnVersionCheck("1.9.0")?e.fn.dataTableExt.aoFeatures.push({fnInit:function(a){var b=a.oInit;return(new g(a,b.scroller||
    b.oScroller||{})).dom.wrapper},cFeature:"S",sFeature:"Scroller"}):alert("Warning: Scroller requires DataTables 1.9.0 or greater - www.datatables.net/download");e.fn.dataTable.Scroller=g;e.fn.DataTable.Scroller=g;if(e.fn.dataTable.Api){var i=e.fn.dataTable.Api;i.register("scroller()",function(){return this});i.register("scroller().rowToPixels()",function(a,b,c){var d=this.context;if(d.length&&d[0].oScroller)return d[0].oScroller.fnRowToPixels(a,b,c)});i.register("scroller().pixelsToRow()",function(a,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          b,c){var d=this.context;if(d.length&&d[0].oScroller)return d[0].oScroller.fnPixelsToRow(a,b,c)});i.register("scroller().scrollToRow()",function(a,b){this.iterator("table",function(c){c.oScroller&&c.oScroller.fnScrollToRow(a,b)});return this});i.register("scroller().measure()",function(a){this.iterator("table",function(b){b.oScroller&&b.oScroller.fnMeasure(a)});return this})}return g};"function"===typeof define&&define.amd?define(["jquery","datatables"],l):"object"===typeof exports?l(require("jquery"),
    require("datatables")):jQuery&&!jQuery.fn.dataTable.Scroller&&l(jQuery,jQuery.fn.dataTable)})(window,document);


///*!
// Autosize v1.18.9 - 2014-05-27
// Automatically adjust textarea height based on user input.
// (c) 2014 Jack Moore - http://www.jacklmoore.com/autosize
// license: http://www.opensource.org/licenses/mit-license.php
// */
//(function(e){var t,o={className:"autosizejs",id:"autosizejs",append:"\n",callback:!1,resizeDelay:10,placeholder:!0},i='<textarea tabindex="-1" style="position:absolute; top:-999px; left:0; right:auto; bottom:auto; border:0; padding: 0; -moz-box-sizing:content-box; -webkit-box-sizing:content-box; box-sizing:content-box; word-wrap:break-word; height:0 !important; min-height:0 !important; overflow:hidden; transition:none; -webkit-transition:none; -moz-transition:none;"/>',n=["fontFamily","fontSize","fontWeight","fontStyle","letterSpacing","textTransform","wordSpacing","textIndent"],s=e(i).data("autosize",!0)[0];s.style.lineHeight="99px","99px"===e(s).css("lineHeight")&&n.push("lineHeight"),s.style.lineHeight="",e.fn.autosize=function(i){return this.length?(i=e.extend({},o,i||{}),s.parentNode!==document.body&&e(document.body).append(s),this.each(function(){function o(){var t,o=window.getComputedStyle?window.getComputedStyle(u,null):!1;o?(t=u.getBoundingClientRect().width,(0===t||"number"!=typeof t)&&(t=parseInt(o.width,10)),e.each(["paddingLeft","paddingRight","borderLeftWidth","borderRightWidth"],function(e,i){t-=parseInt(o[i],10)})):t=p.width(),s.style.width=Math.max(t,0)+"px"}function a(){var a={};if(t=u,s.className=i.className,s.id=i.id,d=parseInt(p.css("maxHeight"),10),e.each(n,function(e,t){a[t]=p.css(t)}),e(s).css(a).attr("wrap",p.attr("wrap")),o(),window.chrome){var r=u.style.width;u.style.width="0px",u.offsetWidth,u.style.width=r}}function r(){var e,n;t!==u?a():o(),s.value=!u.value&&i.placeholder?(p.attr("placeholder")||"")+i.append:u.value+i.append,s.style.overflowY=u.style.overflowY,n=parseInt(u.style.height,10),s.scrollTop=0,s.scrollTop=9e4,e=s.scrollTop,d&&e>d?(u.style.overflowY="scroll",e=d):(u.style.overflowY="hidden",c>e&&(e=c)),e+=w,n!==e&&(u.style.height=e+"px",f&&i.callback.call(u,u))}function l(){clearTimeout(h),h=setTimeout(function(){var e=p.width();e!==g&&(g=e,r())},parseInt(i.resizeDelay,10))}var d,c,h,u=this,p=e(u),w=0,f=e.isFunction(i.callback),z={height:u.style.height,overflow:u.style.overflow,overflowY:u.style.overflowY,wordWrap:u.style.wordWrap,resize:u.style.resize},g=p.width(),y=p.css("resize");p.data("autosize")||(p.data("autosize",!0),("border-box"===p.css("box-sizing")||"border-box"===p.css("-moz-box-sizing")||"border-box"===p.css("-webkit-box-sizing"))&&(w=p.outerHeight()-p.height()),c=Math.max(parseInt(p.css("minHeight"),10)-w||0,p.height()),p.css({overflow:"hidden",overflowY:"hidden",wordWrap:"break-word"}),"vertical"===y?p.css("resize","none"):"both"===y&&p.css("resize","horizontal"),"onpropertychange"in u?"oninput"in u?p.on("input.autosize keyup.autosize",r):p.on("propertychange.autosize",function(){"value"===event.propertyName&&r()}):p.on("input.autosize",r),i.resizeDelay!==!1&&e(window).on("resize.autosize",l),p.on("autosize.resize",r),p.on("autosize.resizeIncludeStyle",function(){t=null,r()}),p.on("autosize.destroy",function(){t=null,clearTimeout(h),e(window).off("resize",l),p.off("autosize").off(".autosize").css(z).removeData("autosize")}),r())})):this}})(window.jQuery||window.$);


//AutoGrow Textarea
//(function(a){a.fn.autogrow=function(b){return this.filter("textarea").each(function(){var d=this;var g=a(d);var f=g.height();var c=g.hasClass("autogrow-short")?0:parseInt(g.css("lineHeight"))||0;var e=a.extend({preGrowCallback:null,postGrowCallback:null},b);var i=a("<div></div>").css({position:"absolute",top:-10000,left:-10000,width:g.width(),fontSize:g.css("fontSize"),fontFamily:g.css("fontFamily"),fontWeight:g.css("fontWeight"),lineHeight:g.css("lineHeight"),resize:"none","word-wrap":"break-word"}).appendTo(document.body);var h=function(k){var m=function(n,q){for(var o=0,p="";o<q;o++){p+=n}return p};var l=d.value.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/&/g,"&amp;").replace(/\n$/,"<br/>&nbsp;").replace(/\n/g,"<br/>").replace(/ {2,}/g,function(n){return m("&nbsp;",n.length-1)+" "});if(k&&k.data&&k.data.event==="keydown"&&(k.keyCode===13 && event.shiftKey)){l+="<br />"}i.css("width",g.width());i.html(l+(c===0?"...":""));var j=Math.max(i.height()+c,f);if(e.preGrowCallback!=null){j=e.preGrowCallback(g,i,j,f)}g.height(j);if(e.postGrowCallback!=null){e.postGrowCallback(g)}};g.change(h).keyup(h).keydown({event:"keydown"},h);a(window).resize(h);h()})}})(jQuery);

(function($)
{
    /**
     * Auto-growing textareas; technique ripped from Facebook
     *
     *
     * http://github.com/jaz303/jquery-grab-bag/tree/master/javascripts/jquery.autogrow-textarea.js
     */
    $.fn.autogrow = function(options)
    {
        return this.filter('textarea').each(function()
        {
            var self         = this;
            var $self        = $(self);
            var minHeight    = $self.height();
            var noFlickerPad = $self.hasClass('autogrow-short') ? 0 : parseInt($self.css('lineHeight')) || 0;
            var settings = $.extend({
                preGrowCallback: null,
                postGrowCallback: null,
                enterPressed: null,
                shiftEnterPressed: null
            }, options );

            var shadow = $('<div></div>').css({
                position:    'absolute',
                top:         -10000,
                left:        -10000,
                width:       $self.width(),
                fontSize:    $self.css('fontSize'),
                fontFamily:  $self.css('fontFamily'),
                fontWeight:  $self.css('fontWeight'),
                lineHeight:  $self.css('lineHeight'),
                resize:      'none',
                'word-wrap': 'break-word'
            }).appendTo(document.body);

            var update = function(event)
            {
                var times = function(string, number)
                {
                    for (var i=0, r=''; i<number; i++) r += string;
                    return r;
                };

                var val = self.value.replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/&/g, '&amp;')
                    .replace(/\n$/, '<br/>&nbsp;')
                    .replace(/\n/g, '<br/>')
                    .replace(/ {2,}/g, function(space){ return times('&nbsp;', space.length - 1) + ' ' });

                // Did enter get pressed?  Resize in this keydown event so that the flicker doesn't occur.
                if (event && event.data && event.data.event === 'keydown' && (event.keyCode === 13 && event.shiftKey)) {
                    val += '<br />';

                    if (settings.shiftEnterPressed!=null) {
                        settings.shiftEnterPressed($self);
                    }
                } else if (event && event.data && event.data.event === 'keydown' && event.keyCode === 13) {
                    var value = val;

                    $self.val('');
                    val = '';
                    $self.height(Math.max(shadow.height() + noFlickerPad, minHeight));

                    if (settings.enterPressed!=null) {
                        settings.enterPressed($self, value);
                    }

                    return false;
                }

                shadow.css('width', $self.width());
                shadow.html(val + (noFlickerPad === 0 ? '...' : '')); // Append '...' to resize pre-emptively.

                var oldHeight=$self.height();
                var newHeight=Math.max(shadow.height() + noFlickerPad, minHeight);
                if(settings.preGrowCallback!=null){
                    newHeight=settings.preGrowCallback($self,shadow,newHeight,minHeight);
                }

                $self.height(newHeight);

                if(settings.postGrowCallback!=null){
                    settings.postGrowCallback($self, oldHeight, newHeight);
                }
            }

            $self.change(update).keyup(update).keydown({event:'keydown'},update);
            $(window).resize(update);

            update();
        });
    };
})(jQuery);

//End AUTOGROW