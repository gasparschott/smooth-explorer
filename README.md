# smooth-explorer

This is a relatively simple plugin for Obsidian that allows you to browse or navigate the file explorer using the up and down arrow keys, opening the files as you go.  

### KEY FEATURES:

#### File Explorer Navigation:  
• `ArrowUp/ArrowDown`: Navigate up and down the file explorer, opening the selected File Explorer item in the most recently active leaf with no further keystrokes needed.  
• `ArrowUp/ArrowDown + Shift`: Open the selected File Explorer item in a new tab.  
• `ArrowUp/ArrowDown + Alt/Opt`: Navigate the file explorer without opening files. (After Obsidian startup, with the File Explorer open but no item focused, use these key combos to focus the active file, if any, or the first or last item.)   
• `Alt/Opt + Enter`: Open the currently focused File Explorer item in the most recently active tab.  
• `Alt/Opt + Shift + Enter`: Open the currently focused File Explorer item in a new tab.

(Note: `Command/Control + Enter` is the default key combo for opening File Explorer items in Obsidian, however opening items this way will bypass the plugin's features, such as preventing duplicated leaves and preserving the focus on the File Explorer.)

#### Other Notes:
• This plugin requires that the core "Files" plugin be enabled.  
• Already open files will not be duplicated.  
• Folders are ignored, but if the folder includes a file named "index.md" or one that has the same name as the folder itself, that file will be loaded.  

