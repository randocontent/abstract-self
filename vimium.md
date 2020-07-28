# Vimium

Very important Chrome extension. 

[Vimium](!g)

## Sleeker hint markers

My css:

```css
div > .vimiumHintMarker {
/* linkhint boxes */
background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,#555),
  color-stop(100%,#333));
border: 1px solid #000;
}

div > .vimiumHintMarker span {
/* linkhint text */
color: ghostwhite;
font-family: 'Fira Code Retina';
text-shadow: none;
font-weight: normal;
font-size: 12.5px;
}

div > .vimiumHintMarker > .matchingCharacter {
	color: yellow;
}
```