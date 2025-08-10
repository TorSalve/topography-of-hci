# Topography of HCI Website

This directory contains the Jekyll-based website for the **Topography of Human-Computer Interaction** project. The website showcases interactive topographies, research methodology, team information, and downloadable resources.

**Live Website**: [https://topography-of-hci.dk/](https://topography-of-hci.dk/)

## About the Website

The website serves as the primary platform for:
- **Exploring Topographies**: Interactive 3D models and contour maps of HCI landscapes
- **Understanding the Method**: How collaborative sculpting maps the HCI field
- **Team Introductions**: Meet the researchers behind the project
- **Resource Sharing**: Access downloadable models and materials
- **Community Building**: Instructions for creating your own topography

## Content Structure

```
docs/
├── _topographies/           # Individual topography entries and data
├── _team/                   # Team member profiles  
├── _data/                   # Site configuration and structured data
├── _includes/               # Reusable HTML components
├── _layouts/                # Page layout templates
├── _sass/                   # SCSS stylesheets
├── assets/                  # CSS, JavaScript, and static files
├── images/                  # Project images and media
├── index.md                 # Homepage content
├── about.md                 # Project overview and background
├── method.md                # Methodology and instructions
├── team.md                  # Team page
├── topographies.md          # Topography gallery
└── _config.yml              # Jekyll configuration
```

## Local Development

### Prerequisites
- Ruby 2.7+
- Jekyll 4.2+
- Bundler gem

### Setup Instructions

1. **Install Dependencies**
   ```bash
   cd docs/
   bundle install
   ```

2. **Start Development Server**
   ```bash
   bundle exec jekyll serve
   ```

3. **View Local Site**
   Open `http://localhost:4000` in your browser

4. **Build for Production**
   ```bash
   bundle exec jekyll build
   ```

## Deployment

### GitHub Pages (Current)
This website is automatically deployed via GitHub Pages from the `/docs` folder. Any push to the main branch triggers a rebuild.

**Live URL**: [https://topography-of-hci.dk/](https://topography-of-hci.dk/)

## Technical Details

This website is built using:
- **Jekyll 4.2+** - Static site generator
- **Bootstrap 4.6** - Responsive grid system and utilities
- **GitHub Pages** - Automatic deployment
- **Jekyll Serif Theme** - Base theme (customized for HCI content)

## License & Credits

### Content License
The website content (text, research materials, documentation) is licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) - see `LICENSE-CONTENT` for details.

### Theme License  
The underlying Jekyll Serif theme is licensed under MIT by Robert Austin (Zerostatic Themes) - see `LICENSE` for details.

### Credits
- **Jekyll Serif Theme**: [Zerostatic Themes](https://www.zerostatic.io) by Robert Austin
- **Icons**: [Noun Project](https://thenounproject.com/)
- **Images**: Project-specific photography and 3D visualizations

---

*This website documents the evolving landscape of Human-Computer Interaction through collaborative, tangible mapping.*
