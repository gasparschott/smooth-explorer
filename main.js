'use strict';

let obsidian = require('obsidian');

class SmoothExplorer extends obsidian.Plugin {
    async onload() {
		// console.log('Loading the Smooth Explorer plugin.');
		// await this.loadSettings();
		const workspace = this.app.workspace;
		const getFileExplorers = () => workspace.getLeavesOfType('file-explorer');
		const fileExplorerArrowNavigation = (e) => {
			e.preventDefault();
			if ( workspace.app.internalPlugins.getPluginById('file-explorer').enabled === false ) { return; }								// return if Files plugin disabled
			let tree = getFileExplorers()[0].view.tree;
			if ( !tree || e.target.classList.contains('is-being-renamed') ) { return; }
			let active_dom = tree.view.activeDom, new_leaf, index;
			let focused_item = tree.focusedItem, focused_file = focused_item?.file;
			let select_this = ( focused_item ? focused_item : active_dom ? active_dom : null );
			let dupe = workspace.getMostRecentLeaf().parent.children.find( leaf => leaf.view.file === focused_item?.file );
			tree.clearSelectedDoms();
			if ( focused_item === null && /ArrowUp|ArrowDown/.test(e.key) && !e.altKey ) { 													// focus items @ initial startup with first arrow keypress
				active_dom !== null ? tree.setFocusedItem(active_dom) : e.key === 'ArrowDown' ? tree.setFocusedItem(tree.root.vChildren.first()) : e.key === 'ArrowUp' ? tree.setFocusedItem(tree.root.vChildren.last()) : null;
			}
			switch(true) {
				case !select_this: case !focused_item:																				break;
				case e.altKey && !(e.key === 'Enter'):																						// navigate without opening file
					switch(true) {
						case e.key === 'ArrowUp':		tree.changeFocusedItem("backwards");										break;
						case e.key === 'ArrowDown':		tree.changeFocusedItem("forwards");											break;
					}
					tree.selectItem(tree.focusedItem);																				return;
				case this.app.vault.getFolderByPath(select_this.file.path) instanceof obsidian.TFolder:										// directories
					tree.setFocusedItem(select_this,{scrollIntoView:true});
					index = tree.focusedItem?.file?.children?.find( item => ( (/index/.test(item.basename) || item.basename === item.parent.name) && /md/.test(item.extension) ) ); // find index file
					if (index) { 
						switch(true) {
							case workspace.getActiveFileView()?.leaf.pinned === true:														// active leaf is pinned
							case workspace.getActiveFileView()?.leaf?.containerEl.closest('.mod-root') === null:							// active leaf in sidebar
							case workspace.getActiveFileView(obsidian.FileView) === null:													// active leaf is empty
								workspace.getLeaf().openFile(index,{active:true});													break;	// open new leaf
							default:
								workspace.getActiveFileView(obsidian.FileView)?.leaf?.openFile(index,{active:false});						// else open file in active leaf
						}
					};																												break;
				case this.app.vault.getFileByPath(focused_item.file.path) instanceof obsidian.TFile:
					switch(true) {
						case workspace.getActiveFileView()?.leaf.pinned === true:															// active leaf is pinned
						case workspace.getActiveFileView()?.leaf?.containerEl.closest('.mod-root') === null:								// active leaf in sidebar
						case workspace.getActiveFileView(obsidian.FileView) === null:
							workspace.getLeaf().openFile(focused_file,{active:false});												break;	// active leaf is empty
						case e.shiftKey && !dupe: 																							// open on shiftKey and no dupes
						case e.shiftKey && e.altKey && e.key === 'Enter' && !dupe:															// open on alt-Enter
							new_leaf = workspace.getLeaf('tab');																			// 
							new_leaf.openFile(focused_file,{active:false});															break;	// open item in new tab
						case e.altKey && e.key === 'Enter' && !dupe:																		// alt+enter and no dupe
						case !e.shiftKey && !dupe: 																							// arrowKey only and no dupe
							workspace.getActiveFileView(obsidian.FileView)?.leaf?.openFile(focused_file,{active:false}); 			break;	// open item in recently active tab
						case dupe !== undefined:
							workspace.setActiveLeaf(dupe,{focus:false});																break;	// focus dupe leaf
					}
					workspace.setActiveLeaf(tree.leaf,{focus:false});																		// refocus file explorer
					break;
			}
			this.app.commands.executeCommandById('file-explorer:open');																		// show file explorer
			workspace.setActiveLeaf(workspace.getLeavesOfType('file-explorer')[0],{focus:true});											// refocus file explorer
		}
		this.registerDomEvent(document,'keydown', (e) => {
			if ( /arrow/i.test(e.key) && /up|down/i.test(e.key) && workspace.getActiveViewOfType(obsidian.View).getViewType() === 'file-explorer' ) { 
				fileExplorerArrowNavigation(e);
			}
		});	
		this.registerDomEvent(document,'keyup', (e) => {
			if ( e.altKey && e.key === 'Enter' && workspace.getActiveViewOfType(obsidian.View)?.getViewType() === 'file-explorer' ) { 
				fileExplorerArrowNavigation(e);
			}
		});	
	} 
    // end onload
    // on plugin unload
	// onunload() {
		// console.log('Unloading the Smooth Explorer plugin.');
    // }
	// load settings
    // async loadSettings() {
		// this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // }
    // save settings
    // async saveSettings() {
		// await this.saveData(this.settings);
    // }
}
module.exports = SmoothExplorer;
