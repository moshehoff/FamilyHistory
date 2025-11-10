import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"
import { version } from "../../package.json"
import { i18n } from "../i18n"
import { execSync } from "child_process"

interface Options {
  links: Record<string, string>
}

// Get git commit hash at build time
let gitHash = "unknown"
try {
  gitHash = execSync("git rev-parse --short HEAD").toString().trim()
} catch (e) {
  // If git is not available, use timestamp
  gitHash = Date.now().toString().slice(-6)
}

const buildTimestamp = new Date().toISOString()

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>
          {i18n(cfg.locale).components.footer.createdWith}{" "}
          <a href="https://quartz.jzhao.xyz/">Quartz v{version}</a> © {year}
          <span style="margin-left: 1rem; font-size: 0.75rem; opacity: 0.6;" title={`Build: ${buildTimestamp}`}>
            v{gitHash}
          </span>
        </p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
