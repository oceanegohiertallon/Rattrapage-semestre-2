import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App - planning MATRiCE', () => {
  it('affiche les séances après le chargement (succès)', async () => {
    render(<App />)

    // Pendant le chargement
    expect(screen.getByText(/Chargement des séances/i)).toBeInTheDocument()

    // Les 6 séances du jeu de données doivent apparaître
    expect(await screen.findByText('React composants')).toBeInTheDocument()
    expect(screen.getByText('Travail autonome')).toBeInTheDocument()
    expect(screen.queryByText(/Chargement des séances/i)).not.toBeInTheDocument()
  })

  it('le filtre groupe A inclut aussi les séances de la Promotion entière', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('React composants')

    await user.selectOptions(screen.getByLabelText(/^Groupe$/i), 'A')

    // s01 (groupe A) et s03/s06 (Promotion) doivent être visibles
    expect(await screen.findByText('React composants')).toBeInTheDocument() // s01, groupe A
    expect(screen.getByText('Données et SQL')).toBeInTheDocument() // s03, Promotion
    expect(screen.getByText('Travail autonome')).toBeInTheDocument() // s06, Promotion

    // s02 (groupe B uniquement) ne doit plus apparaître
    expect(screen.queryByText('React événements')).not.toBeInTheDocument()
  })

  it('affiche un message quand aucune séance ne correspond aux filtres (résultat vide)', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('React composants')

    await user.type(screen.getByLabelText(/Rechercher une séance/i), 'texte-qui-ne-matche-rien-xyz')

    expect(await screen.findByText(/Aucune séance ne correspond à ces filtres/i)).toBeInTheDocument()
  })

  it('le filtre groupe a un nom accessible et peut être utilisé entièrement au clavier', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByText('React composants')

    // nom accessible via le label
    const groupSelect = screen.getByRole('combobox', { name: /^Groupe$/i })
    expect(groupSelect).toBeInTheDocument()

    // atteignable au clavier
    await user.tab()
    expect(groupSelect).toHaveFocus()

    await user.selectOptions(groupSelect, 'B')
    expect(groupSelect).toHaveValue('B')

    await screen.findByText('React événements')
    expect(screen.queryByText('Authentification')).not.toBeInTheDocument() // s04, groupe A seul
  })

  it("ouvre le détail d'une séance et affiche les mêmes informations que la carte", async () => {
    const user = userEvent.setup()
    render(<App />)

    const card = await screen.findByRole('button', { name: /React composants/i })
    await user.click(card)

    const dialog = await screen.findByRole('dialog', { name: /React composants/i })
    expect(within(dialog).getByText('Camille Exemple')).toBeInTheDocument()
    expect(within(dialog).getByText('web')).toBeInTheDocument()
  })
})
