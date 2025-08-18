'use strict';

let obsidian = require('obsidian');
let DEFAULT_SETTINGS = {
	'disable_reveal_active_file_in_explorer': 		false,
	'prefer_index_base_instead_of_md': 				false	
}
class SmoothExplorer extends obsidian.Plugin {
    async onload() {
		// console.log('Loading the Smooth Explorer plugin.');
		await this.loadSettings();
		this.addSettingTab(new SmoothExplorerSettings(this.app, this));
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
			let index_type = new RegExp (( this.settings.prefer_index_base_instead_of_md === true ? "base" : "md" ),'i');
			tree.clearSelectedDoms();
			if ( focused_item === null && /ArrowUp|ArrowDown/.test(e.key) && !e.altKey ) { 													// focus items @ initial startup with first arrow keypress
				active_dom !== null ? tree.setFocusedItem(active_dom) 
					: e.key === 'ArrowDown' ? tree.setFocusedItem(tree.root.vChildren.first()) 
					: e.key === 'ArrowUp' ? tree.setFocusedItem(tree.root.vChildren.last()) 
					: null;
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
					index = tree.focusedItem?.file?.children?.find(																			// find index file
						( item ) => {
							if ( (/index/.test(item.basename) || item.basename === item.parent.name) ) {
								switch(true) {
									case index_type.test(item.extension) && this.settings.prefer_index_base_instead_of_md:			return true;
									case index_type.test(item.extension) && /md/.test(item.extension):								return true;
									case index_type.test(item.extension) && /base/.test(item.extension):							return true;
								}
							}
					});
					if (index) {																											// if index found...
						switch(true) {
							case workspace.getActiveFileView()?.leaf.pinned === true:														// active leaf is pinned
							case workspace.getActiveFileView()?.leaf?.containerEl.closest('.mod-root') === null:							// active leaf in sidebar
							case workspace.getActiveFileView(obsidian.FileView) === null:													// active leaf is empty
								workspace.getLeaf().openFile(index,{active:false});													break;	// open new leaf
							default:
								workspace.getActiveFileView(obsidian.FileView)?.leaf?.openFile(index,{active:false});						// else open file in active leaf
						}
					} else { 
								workspace.getActiveFileView(obsidian.FileView)?.leaf?.detach();												// ...else close active file
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
							workspace.setActiveLeaf(dupe,{focus:false});															break;	// focus dupe leaf
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
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (e) => {
				if ( workspace.getActiveViewOfType(obsidian.View).getViewType() === 'file-explorer' ) {
					if ( this.settings.disable_reveal_active_file_in_explorer === true ) { 
						return; 
					} else { 
						this.app.commands.executeCommandById('file-explorer:reveal-active-file'); 			// reveal active file on file explorer becoming active
					}
					let tree = workspace.getLeavesOfType('file-explorer')[0].view.tree;
					tree?.setFocusedItem(tree?.view?.activeDom);												// focus the active file explorer item
				}
			})
		);
	} 
    // end onload
    // on plugin unload
	// onunload() {
		// console.log('Unloading the Smooth Explorer plugin.');
    // }
	// load settings
    async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    // save settings
    async saveSettings() {
		await this.saveData(this.settings);
    }
}
let SmoothExplorerSettings = class extends obsidian.PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display() {
		const { containerEl } = this;
		containerEl.empty();
        containerEl.createEl("h1", {}, (el) => {el.innerHTML = 'Smooth Explorer'; });
		new obsidian.Setting(containerEl).setName('Disable reveal active file in File Explorer').setDesc('Prevents revealing the active item when the File Explorer becomes active.')
			.addToggle( A => A.setValue(this.plugin.settings.disable_reveal_active_file_in_explorer)
			.onChange(async (value) => {
				this.plugin.settings.disable_reveal_active_file_in_explorer = value;
				await this.plugin.saveSettings();
		}));
		new obsidian.Setting(containerEl).setName('Prefer index.base to index.md').setDesc('When a File Explorer folder is selected, show index.base instead of index.md (if both exist). Enabling this will also prefer a .base file named after the enclosing folder to a similarly-named .md file (again, if both exist). If only one index file is found, it will be shown whether it is a .base or an .md file.')
			.addToggle( A => A.setValue(this.plugin.settings.prefer_index_base_instead_of_md)
			.onChange(async (value) => {
				this.plugin.settings.prefer_index_base_instead_of_md = value;
				await this.plugin.saveSettings();
		}));
	}
}
module.exports = SmoothExplorer;
